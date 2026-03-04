import { ChangeEvent, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ArrowRight, CheckCircle2, FileText, X, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

// Validation schemas for each step
const step1Schema = z.object({
  applicantCapacity: z.string().min(1, "Please select a capacity"),
  ownerName: z.string().optional(),
  applicantName: z.string().min(2, "Name must be at least 2 characters"),
  applicantEmail: z.string().email("Invalid email address"),
  applicantPhone: z.string().regex(
    /^(\+639|09)\d{9}$|^\d{11}$/,
    "Phone number must be in format: +639123456789, 09123456789, or 11 digits"
  ),
  propertyAddress: z.string().min(5, "Address must be at least 5 characters"),
  barangay: z.string().min(1, "Please select a barangay"),
});

const step2Schema = z.object({
  propertyLocation: z.string().min(5, "Location must be at least 5 characters"),
  projectType: z.string().min(1, "Please select a project type"),
  projectScope: z.string().min(10, "Scope must be at least 10 characters"),
  buildingClassification: z.string().min(1, "Please select a building classification"),
});

const fullSchema = step1Schema.merge(step2Schema);

type FormData = z.infer<typeof fullSchema> & {
  attachments?: Array<{ name: string; url: string; type: string }>;
};

async function fileToBase64(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(arrayBuffer);
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    for (let chunkIndex = 0; chunkIndex < chunk.length; chunkIndex++) {
      binary += String.fromCharCode(chunk[chunkIndex]);
    }
  }

  return btoa(binary);
}

const barangays = [
  "Antipolo",
  "Balubal",
  "Barangay 1 (Pob.)",
  "Barangay 2 (Pob.)",
  "Barangay 3 (Pob.)",
  "Barangay 4 (Pob.)",
  "Barangay 5 (Pob.)",
  "Barangay 6 (Pob.)",
  "Bignay 1",
  "Bignay 2",
  "Bucal",
  "Canda",
  "Castañas",
  "Concepcion 1",
  "Concepcion Banahaw",
  "Concepcion Palasan",
  "Concepcion Pinagbakuran",
  "Gibanga",
  "Guisguis San Roque",
  "Guisguis Talon",
  "Janagdong 1",
  "Janagdong 2",
  "Limbon",
  "Lutucan 1",
  "Lutucan Bata",
  "Lutucan Malabag",
  "Mamala 1",
  "Mamala 2",
  "Manggalang 1",
  "Manggalang Bantilan",
  "Manggalang Kiling",
  "Manggalang Tulo-Tulo",
  "Montecillo",
  "Morong",
  "Pili",
  "Sampaloc 1",
  "Sampaloc 2",
  "Sampaloc Bogon",
  "Sampaloc Santo Cristo",
  "Talaan Aplaya",
  "Talaan Pantoc",
  "Tumbaga 1",
  "Tumbaga 2",
];

const capacities = ["Owner", "Authorized Representative"];

const projectTypes = [
  "Dwellings",
  "Buildings/Structures",
  "Hotels",
  "Apartments",
];

const baseRequiredDocuments = [
  {
    key: "buildPlans",
    label:
      "Build plans, structural analysis, bill of materials, and specification signed by a duly licensed civil engineer/architect",
  },
  {
    key: "electricalPermit",
    label: "Electrical permit/plan signed by a duly licensed professional electrical engineer",
  },
  {
    key: "sanitaryPermit",
    label: "Sanitary/plumbing permit signed by a duly licensed master plumber/sanitary engineer",
  },
  { key: "taxDeclaration", label: "Tax declaration" },
  { key: "transferTitle", label: "Transfer certificate of title" },
  { key: "taxReceipt", label: "Tax receipt of current year" },
  { key: "barangayClearance", label: "Barangay clearance" },
  { key: "doleApplication", label: "DOLE application (CHSP) - Grand Central" },
];

const nonLotOwnerDocuments = [
  { key: "lotOwnerAuthorization", label: "Authorization from the lot owner" },
  { key: "constructAuthorization", label: "Authorization to erect/construct building" },
];

export default function ApplicationForm() {
  const { user, isAuthenticated, loading } = useAuth();
  const canStartApplication = isAuthenticated && user?.role === "user";
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<FormData>>({});
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File | null>>({});
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({});

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(step === 1 ? step1Schema : step === 2 ? step2Schema : fullSchema) as any,
    defaultValues: formData as any,
    mode: "onBlur",
  });

  const createApplicationMutation = trpc.applications.create.useMutation();
  const uploadAttachmentMutation = trpc.applications.uploadAttachment.useMutation();
  const checkEmailAvailabilityMutation = trpc.applications.checkEmailAvailability.useMutation();

  const watchedValues = watch() as Partial<FormData>;
  const shouldShowNonLotOwnerDocs = watchedValues.applicantCapacity === "Authorized Representative";
  const requiredDocuments = [
    ...baseRequiredDocuments,
    ...(shouldShowNonLotOwnerDocs ? nonLotOwnerDocuments : []),
  ];

  useEffect(() => {
    return () => {
      // Only revoke blob URLs when component unmounts, not on every step change
      if (step === 4) return; // Don't revoke while on review step
    };
  }, []);

  const handleRemoveFile = (documentKey: string) => {
    // Immediately reset the input value
    const fileInput = document.querySelector(`#${documentKey}`) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
    
    // Clean up blob URL synchronously
    if (previewUrls[documentKey]?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrls[documentKey]);
    }
    
    // Update state - remove file completely
    setUploadedFiles((prev) => {
      const updated = { ...prev };
      delete updated[documentKey];
      return updated;
    });
    
    setPreviewUrls((prev) => {
      const updated = { ...prev };
      delete updated[documentKey];
      return updated;
    });
    
    setFileErrors((prev) => {
      const updated = { ...prev };
      delete updated[documentKey];
      return updated;
    });
  };

  const handleFileChange = (documentKey: string, event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] ?? null;

    if (!selectedFile) {
      setUploadedFiles((prev) => ({ ...prev, [documentKey]: null }));
      setPreviewUrls((prev) => {
        const previousUrl = prev[documentKey];
        if (previousUrl?.startsWith("blob:")) {
          URL.revokeObjectURL(previousUrl);
        }
        const { [documentKey]: removed, ...rest } = prev;
        return rest;
      });
      return;
    }

    if (!/\.(jpe?g|pdf)$/i.test(selectedFile.name)) {
      setFileErrors((prev) => ({
        ...prev,
        [documentKey]: "Only .jpg, .jpeg, or .pdf files are allowed.",
      }));
      setUploadedFiles((prev) => ({ ...prev, [documentKey]: null }));
      event.target.value = "";
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);

    setPreviewUrls((prev) => {
      const previousUrl = prev[documentKey];
      if (previousUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previousUrl);
      }
      return {
        ...prev,
        [documentKey]: objectUrl,
      };
    });
    setUploadedFiles((prev) => ({ ...prev, [documentKey]: selectedFile }));
    setFileErrors((prev) => ({
      ...prev,
      [documentKey]: "",
    }));
  };

  const validateRequiredFiles = () => {
    const nextFileErrors: Record<string, string> = {};

    requiredDocuments.forEach((doc) => {
      if (!uploadedFiles[doc.key]) {
        nextFileErrors[doc.key] = "This file is required.";
      }
    });

    setFileErrors(nextFileErrors);
    return Object.keys(nextFileErrors).length === 0;
  };

  const onNext = async () => {
    if (step === 3) {
      if (!validateRequiredFiles()) {
        toast.error("Please upload all required documents before continuing.");
        return;
      }
      setStep(4);
      return;
    }

    await handleSubmit(async (data) => {
      setFormData((prev) => ({ ...prev, ...data }));
      setStep((prev) => Math.min(prev + 1, 4));
    })();
  };

  const onSubmit = handleSubmit(async (data) => {
    if (!validateRequiredFiles()) {
      toast.error("Please upload all required documents before submitting.");
      return;
    }

    try {
      const applicantEmail = formData.applicantEmail || data.applicantEmail || "";
      
      // Check email availability BEFORE uploading files
      toast.loading("Checking email availability...");
      try {
        const emailCheckResult = await checkEmailAvailabilityMutation.mutateAsync({ 
          email: applicantEmail 
        });
        
        if (!emailCheckResult.available) {
          toast.dismiss();
          toast.error(emailCheckResult.message);
          return;
        }
      } catch (error) {
        toast.dismiss();
        throw new Error("Failed to verify email. Please try again.");
      }
      
      toast.dismiss();
      toast.loading("Uploading documents...");

      const completeData = {
        applicantName: formData.applicantName || data.applicantName || "",
        applicantEmail: applicantEmail,
        applicantPhone: formData.applicantPhone || data.applicantPhone || "",
        applicantCapacity: formData.applicantCapacity || data.applicantCapacity || "",
        barangay: formData.barangay || data.barangay || "",
        propertyLocation: formData.propertyLocation || data.propertyLocation || "",
        propertyAddress: formData.propertyAddress || data.propertyAddress || "",
        projectType: data.projectType || "",
        projectScope: data.projectScope || "",
        buildingClassification: data.buildingClassification || "",
        ownerName: (formData.applicantCapacity || data.applicantCapacity) === "Authorized Representative" ? (formData.ownerName || data.ownerName || "") : undefined,
      };

      const attachments = await Promise.all(
        requiredDocuments.map(async (document) => {
          const file = uploadedFiles[document.key];
          if (!file) {
            throw new Error(`Missing file for ${document.label}`);
          }

          const fileBase64 = await fileToBase64(file);
          const uploaded = await uploadAttachmentMutation.mutateAsync({
            documentKey: document.key,
            fileName: file.name,
            mimeType: file.type === "application/pdf" ? "application/pdf" : "image/jpeg",
            fileBase64,
          });

          return {
            name: file.name,
            url: uploaded.url,
            type: file.type,
          };
        })
      );

      toast.dismiss();
      toast.loading("Creating application...");

      const result = await createApplicationMutation.mutateAsync({
        ...completeData,
        attachments,
      });

      toast.dismiss();
      toast.success("Application submitted successfully!");
      navigate(`/submission-confirmation?refNumber=${result.referenceNumber}`);
    } catch (error: any) {
      toast.dismiss();
      const message = error?.message || "Failed to submit application. Please try again.";
      toast.error(message);
      console.error(error);
    }
  });

  const progress = (step / 4) * 100;

  useEffect(() => {
    if (loading || canStartApplication) return;
    toast.error("You must sign in with Gmail first before starting an application.");
    navigate("/login");
  }, [canStartApplication, loading, navigate]);

  if (loading || !canStartApplication) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <p className="text-sm text-muted-foreground">Redirecting to sign in...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-blue-950 dark:via-slate-900 dark:to-purple-950 py-8 px-4 animate-fade-in">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate("/")}
          className="mb-6 btn-ghost-meo animate-slide-in-left"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Home
        </Button>

        {/* Header with Logos */}
        <div className="mb-8 animate-slide-in-down">
          {/* Logo Section */}
          <div className="flex flex-col items-center justify-center gap-6 mb-8">
            <div className="flex items-center justify-center gap-8 flex-wrap">
              {/* Sariaya Municipal Logo */}
              <div className="flex flex-col items-center group">
                <div className="relative bg-background dark:bg-muted/20 rounded-full p-3 shadow-lg group-hover:shadow-xl transition-all duration-300 border border-border dark:border-border/50 group-hover:scale-110">
                  <img 
                    src="/sariaya-logo.png" 
                    alt="Sariaya Municipal Logo" 
                    className="h-24 w-24 object-contain filter drop-shadow-md"
                  />
                </div>
                <p className="text-xs font-semibold text-muted-foreground mt-3 text-center">Municipal Government</p>
              </div>
              
              {/* MEO Logo (Main Focus) */}
              <div className="flex flex-col items-center group">
                <div className="relative bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full p-4 shadow-lg group-hover:shadow-2xl group-hover:from-blue-200 group-hover:to-purple-200 dark:group-hover:from-blue-800/50 dark:group-hover:to-purple-800/50 transition-all duration-300 border-2 border-primary/20 dark:border-primary/40 group-hover:scale-110 group-hover:-translate-y-2">
                  <img 
                    src="/meo-logo.png" 
                    alt="MEO Engineering Office Logo" 
                    className="h-32 w-32 object-contain filter drop-shadow-lg"
                  />
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                </div>
                <p className="text-xs font-semibold text-primary mt-3 text-center">Engineering Office</p>
              </div>
            </div>
            
            {/* Title Section */}
            <div className="text-center">
              <h1 className="text-4xl font-bold text-foreground mb-2">Building Permit Application</h1>
              <p className="text-muted-foreground text-lg">Municipality of Sariaya - Engineering Office</p>
              <p className="text-muted-foreground mt-2">Complete all steps to submit your application</p>
            </div>
          </div>
          
          {/* Divider */}
          <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 rounded-full mb-6"></div>
        </div>

        {/* Progress Bar */}
        <Card className="mb-8 p-6 card-hover animate-slide-in-up shadow-lg">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-foreground">Step {step} of 4</span>
              <span className="inline-block px-3 py-1 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-full text-sm font-bold text-primary">{Math.round(progress)}%</span>
            </div>
            <Progress
              value={progress}
              className="h-3 bg-primary/20 rounded-full [&_[data-slot=progress-indicator]]:bg-gradient-to-r [&_[data-slot=progress-indicator]]:from-blue-500 [&_[data-slot=progress-indicator]]:to-purple-500 [&_[data-slot=progress-indicator]]:duration-700 [&_[data-slot=progress-indicator]]:ease-out"
            />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              {[
                { num: 1, label: "Applicant", done: step >= 1 },
                { num: 2, label: "Property", done: step >= 2 },
                { num: 3, label: "Documents", done: step >= 3 },
                { num: 4, label: "Review", done: step >= 4 }
              ].map((item) => (
                <div
                  key={item.num}
                  className={`py-3 px-3 rounded-lg text-center transition-all duration-300 transform hover:scale-105 ${
                    item.done
                      ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md scale-105"
                      : step === item.num
                      ? "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 border-2 border-blue-500 shadow-md"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                  }`}
                >
                  <div className="text-xs font-bold">{item.num}</div>
                  <div className="text-xs sm:text-sm font-semibold">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Form */}
        <form
          onSubmit={(e: any) => {
            e.preventDefault();
            if (step < 4) {
              onNext();
              return;
            }
            onSubmit();
          }}
        >
          <Card className="p-6 sm:p-8 space-y-8 card-hover shadow-xl animate-scale-in">
            {step === 1 && (
              <>
                <div className="space-y-6">
                  <div className="inline-block px-4 py-2 bg-blue-100 dark:bg-blue-900 rounded-full text-sm font-semibold text-blue-800 dark:text-blue-100">
                    👤 Applicant Information
                  </div>
                
                  {/* Capacity - First Field */}
                  <div>
                    <Label htmlFor="applicantCapacity" className="text-base font-semibold mb-3 block text-foreground">
                      Your Capacity <span className="text-red-500">*</span>
                    </Label>
                    <Select value={watchedValues.applicantCapacity || ""} onValueChange={(value) => setValue("applicantCapacity", value)}>
                      <SelectTrigger id="applicantCapacity">
                        <SelectValue placeholder="Select capacity" />
                      </SelectTrigger>
                      <SelectContent>
                        {capacities.map((cap) => (
                          <SelectItem key={cap} value={cap}>
                            {cap}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.applicantCapacity && (
                      <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                        ⚠️ {errors.applicantCapacity.message}
                      </p>
                    )}
                  </div>

                  {/* Conditional Owner Name - Only shown if Authorized Representative */}
                  {watchedValues.applicantCapacity === "Authorized Representative" && (
                    <div className="space-y-4 p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-amber-700 dark:text-amber-300">
                          As an Authorized Representative, you will need to provide 2 additional documents: <strong>Authorization from the lot owner</strong> and <strong>Authorization to erect/construct building</strong>. These will be required in the Documents step.
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="ownerName" className="text-base font-semibold mb-3 block text-foreground">
                          Property/Lot Owner Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="ownerName"
                          placeholder="Enter the property owner's full name"
                          {...register("ownerName")}
                          className={`transition-all ${errors.ownerName ? "border-red-500 ring-2 ring-red-200" : ""}`}
                        />
                        {errors.ownerName && (
                          <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                            ⚠️ {errors.ownerName.message}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Full Name */}
                  <div>
                    <Label htmlFor="applicantName" className="text-base font-semibold mb-3 block text-foreground">
                      Full Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="applicantName"
                      placeholder="Enter your full name"
                      {...register("applicantName")}
                      className={`transition-all ${errors.applicantName ? "border-red-500 ring-2 ring-red-200" : ""}`}
                    />
                    {errors.applicantName && (
                      <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                        ⚠️ {errors.applicantName.message}
                      </p>
                    )}
                  </div>

                  {/* Email and Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="applicantEmail" className="text-base font-semibold mb-3 block text-foreground">
                        Email Address <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="applicantEmail"
                        type="email"
                        placeholder="your.email@example.com"
                        {...register("applicantEmail")}
                        className={`transition-all ${errors.applicantEmail ? "border-red-500 ring-2 ring-red-200" : ""}`}
                      />
                      {errors.applicantEmail && (
                        <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                          ⚠️ {errors.applicantEmail.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="applicantPhone" className="text-base font-semibold mb-3 block text-foreground">
                        Phone Number <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="applicantPhone"
                        placeholder="+639123456789 or 09123456789"
                        {...register("applicantPhone")}
                        className={`transition-all ${errors.applicantPhone ? "border-red-500 ring-2 ring-red-200" : ""}`}
                      />
                      {errors.applicantPhone && (
                        <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                          ⚠️ {errors.applicantPhone.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Barangay */}
                  <div>
                    <Label htmlFor="barangay" className="text-base font-semibold mb-3 block text-foreground">
                      Barangay <span className="text-red-500">*</span>
                    </Label>
                    <Select value={watchedValues.barangay || ""} onValueChange={(value) => setValue("barangay", value)}>
                      <SelectTrigger id="barangay">
                        <SelectValue placeholder="Select barangay" />
                      </SelectTrigger>
                      <SelectContent className="max-h-96 overflow-y-auto">
                        {barangays.map((brgy) => (
                          <SelectItem key={brgy} value={brgy}>
                            {brgy}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.barangay && (
                      <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                        ⚠️ {errors.barangay.message}
                      </p>
                    )}
                  </div>

                  {/* Complete Address */}
                  <div>
                    <Label htmlFor="propertyAddress" className="text-base font-semibold mb-3 block text-foreground">
                      Complete Address <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="propertyAddress"
                      placeholder="Enter the complete property address"
                      {...register("propertyAddress")}
                      className={`transition-all ${errors.propertyAddress ? "border-red-500 ring-2 ring-red-200" : ""}`}
                      rows={3}
                    />
                    {errors.propertyAddress && (
                      <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                        ⚠️ {errors.propertyAddress.message}
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="space-y-6">
                  <div className="inline-block px-4 py-2 bg-purple-100 dark:bg-purple-900 rounded-full text-sm font-semibold text-purple-800 dark:text-purple-100">
                    🏠 Property & Project Details
                  </div>

                  <div>
                    <Label htmlFor="propertyLocation" className="text-base font-semibold mb-3 block text-foreground">
                      Property Location <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="propertyLocation"
                      placeholder="e.g., Lot 5, Block 3, Sariaya Heights"
                      {...register("propertyLocation")}
                      className={`transition-all ${errors.propertyLocation ? "border-red-500 ring-2 ring-red-200" : ""}`}
                    />
                    {errors.propertyLocation && (
                      <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                        ⚠️ {errors.propertyLocation.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="projectType" className="text-base font-semibold mb-3 block text-foreground">
                      Project Type <span className="text-red-500">*</span>
                    </Label>
                    <Select value={watchedValues.projectType || ""} onValueChange={(value) => setValue("projectType", value)}>
                      <SelectTrigger id="projectType">
                        <SelectValue placeholder="Select project type" />
                      </SelectTrigger>
                      <SelectContent>
                        {projectTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.projectType && (
                      <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                        ⚠️ {errors.projectType.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="buildingClassification" className="text-base font-semibold mb-3 block text-foreground">
                      Classification of Building <span className="text-red-500">*</span>
                    </Label>
                    <Select value={watchedValues.buildingClassification || ""} onValueChange={(value) => setValue("buildingClassification", value)}>
                      <SelectTrigger id="buildingClassification">
                        <SelectValue placeholder="Select building classification" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Residential">Residential</SelectItem>
                      </SelectContent>
                    </Select>
                    {watchedValues.buildingClassification && (
                      <div className="mt-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-200 flex items-center gap-2">
                          ⏱️ Estimated Processing Time:
                          <span className="font-bold">1-3 days</span>
                        </p>
                      </div>
                    )}
                    {errors.buildingClassification && (
                      <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                        ⚠️ {errors.buildingClassification.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="projectScope" className="text-base font-semibold mb-3 block text-foreground">
                      Project Scope <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="projectScope"
                      placeholder="Describe the scope of your project in detail"
                      {...register("projectScope")}
                      className={`transition-all ${errors.projectScope ? "border-red-500 ring-2 ring-red-200" : ""}`}
                      rows={4}
                    />
                    {errors.projectScope && (
                      <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                        ⚠️ {errors.projectScope.message}
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className="space-y-6">
                  <div className="inline-block px-4 py-2 bg-amber-100 dark:bg-amber-900 rounded-full text-sm font-semibold text-amber-800 dark:text-amber-100">
                    📄 Required Documents
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-base font-semibold text-foreground">Upload Required Documents</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      📎 Upload one (1) copy each. Accepted file types: .jpg, .jpeg, .pdf.
                    </p>
                  </div>

                  {baseRequiredDocuments.map((document, index) => (
                    <div key={document.key} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
                      <Label htmlFor={document.key} className="text-base font-semibold text-foreground">
                        {index + 1}. {document.label} <span className="text-red-500">*</span>
                      </Label>
                      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 transition-all hover:border-primary/50 hover:bg-primary/5 cursor-pointer">
                        <Input
                          id={document.key}
                          type="file"
                          accept=".jpg,.jpeg,.pdf,application/pdf,image/jpeg"
                          onChange={(event) => handleFileChange(document.key, event)}
                          className={`cursor-pointer ${fileErrors[document.key] ? "border-red-500" : ""}`}
                        />
                      </div>
                      {uploadedFiles[document.key] && previewUrls[document.key] && (
                        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                          <a
                            href={previewUrls[document.key]}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-green-700 dark:text-green-300 underline flex-1 truncate hover:no-underline"
                          >
                            ✓ {uploadedFiles[document.key]?.name}
                          </a>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(document.key)}
                            className="text-red-500 hover:text-red-700 transition-colors p-1"
                            title="Remove file"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                      {fileErrors[document.key] && (
                        <p className="text-red-500 text-sm flex items-center gap-1">
                          ⚠️ {fileErrors[document.key]}
                        </p>
                      )}
                    </div>
                  ))}

                  {shouldShowNonLotOwnerDocs && (
                    <div className="border-2 border-orange-200 dark:border-orange-800 rounded-lg p-6 space-y-4 bg-orange-50 dark:bg-orange-950">
                      <p className="text-sm font-semibold text-orange-900 dark:text-orange-100">
                        📋 Additional requirements for non-lot owners & authorized representatives
                      </p>
                      {nonLotOwnerDocuments.map((document, index) => (
                        <div key={document.key} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
                          <Label htmlFor={document.key} className="text-base font-semibold text-foreground">
                            {index + 1}. {document.label} <span className="text-red-500">*</span>
                          </Label>
                          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 transition-all hover:border-primary/50 hover:bg-primary/5 cursor-pointer">
                            <Input
                              id={document.key}
                              type="file"
                              accept=".jpg,.jpeg,.pdf,application/pdf,image/jpeg"
                              onChange={(event) => handleFileChange(document.key, event)}
                              className={`cursor-pointer ${fileErrors[document.key] ? "border-red-500" : ""}`}
                            />
                          </div>
                          {uploadedFiles[document.key] && previewUrls[document.key] && (
                            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                              <a
                                href={previewUrls[document.key]}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm text-green-700 dark:text-green-300 underline flex-1 truncate hover:no-underline"
                              >
                                ✓ {uploadedFiles[document.key]?.name}
                              </a>
                              <button
                                type="button"
                                onClick={() => handleRemoveFile(document.key)}
                                className="text-red-500 hover:text-red-700 transition-colors p-1"
                                title="Remove file"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                          {fileErrors[document.key] && (
                            <p className="text-red-500 text-sm flex items-center gap-1">
                              ⚠️ {fileErrors[document.key]}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <div>
                  <p className="text-base font-semibold">Review Your Application</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Please review all details below. You may go back to edit before submitting.
                  </p>
                </div>

                <div className="space-y-4 border rounded-lg p-4">
                  <p className="font-semibold">Applicant Information</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <p><span className="font-medium">Your Capacity:</span> {formData.applicantCapacity || watchedValues.applicantCapacity || "-"}</p>
                    {(formData.applicantCapacity || watchedValues.applicantCapacity) === "Authorized Representative" && (
                      <p><span className="font-medium">Property Owner Name:</span> {formData.ownerName || watchedValues.ownerName || "-"}</p>
                    )}
                    <p><span className="font-medium">Full Name:</span> {formData.applicantName || watchedValues.applicantName || "-"}</p>
                    <p><span className="font-medium">Email:</span> {formData.applicantEmail || watchedValues.applicantEmail || "-"}</p>
                    <p><span className="font-medium">Phone:</span> {formData.applicantPhone || watchedValues.applicantPhone || "-"}</p>
                  </div>
                </div>

                <div className="space-y-4 border rounded-lg p-4">
                  <p className="font-semibold">Property & Location Details</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <p><span className="font-medium">Property Location:</span> {formData.propertyLocation || watchedValues.propertyLocation || "-"}</p>
                    <p><span className="font-medium">Barangay:</span> {formData.barangay || watchedValues.barangay || "-"}</p>
                    <p className="sm:col-span-2"><span className="font-medium">Complete Address:</span> {formData.propertyAddress || watchedValues.propertyAddress || "-"}</p>
                  </div>
                </div>

                <div className="space-y-4 border rounded-lg p-4">
                  <p className="font-semibold">Project Details</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <p><span className="font-medium">Project Type:</span> {formData.projectType || watchedValues.projectType || "-"}</p>
                    <p><span className="font-medium">Building Classification:</span> {formData.buildingClassification || watchedValues.buildingClassification || "-"}</p>
                    <p className="sm:col-span-2"><span className="font-medium">Project Scope:</span> {formData.projectScope || watchedValues.projectScope || "-"}</p>
                  </div>
                </div>

                <div className="space-y-4 border rounded-lg p-4">
                  <p className="font-semibold">Uploaded Documents</p>
                  <div className="space-y-2 text-sm">
                    {requiredDocuments.map((document, index) => (
                      <div key={document.key} className="flex flex-col gap-1">
                        <p>
                          <span className="font-medium">{index + 1}. {document.label}:</span>{" "}
                          {uploadedFiles[document.key]?.name || "-"}
                        </p>
                        {uploadedFiles[document.key] && previewUrls[document.key] && (
                          <a
                            href={previewUrls[document.key]}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary underline w-fit"
                          >
                            View file
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </Card>

          {/* Navigation Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-4 mt-10">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={(e: any) => {
                  e.preventDefault();
                  setStep((prev) => Math.max(prev - 1, 1));
                }}
                className="btn-secondary-meo flex items-center gap-2 transition-all"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            )}
            {step < 4 && (
              <Button
                type="button"
                onClick={(e: any) => {
                  e.preventDefault();
                  onNext();
                }}
                className="btn-primary-meo ml-auto flex items-center gap-2 animate-scale-in"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
            {step === 4 && (
              <Button
                type="submit"
                disabled={createApplicationMutation.isPending || uploadAttachmentMutation.isPending}
                className="btn-primary-meo ml-auto flex items-center gap-2 animate-scale-in disabled:opacity-60"
              >
                {createApplicationMutation.isPending || uploadAttachmentMutation.isPending ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Submit Application
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
