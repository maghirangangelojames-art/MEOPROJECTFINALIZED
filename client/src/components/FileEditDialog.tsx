import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, Upload, File } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FileEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileName: string;
  fileIndex: number;
  onSubmit: (
    fileIndex: number,
    file: File,
    fileName: string
  ) => Promise<void>;
  isLoading?: boolean;
}

export default function FileEditDialog({
  open,
  onOpenChange,
  fileName,
  fileIndex,
  onSubmit,
  isLoading = false,
}: FileEditDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type (only PDF, JPEG, JPG)
      const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg"];
      if (!allowedTypes.includes(file.type)) {
        setError("Only PDF, JPEG, and JPG files are allowed");
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError("File size exceeds 10MB limit");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      setError("Please select a file to upload");
      return;
    }

    setUploading(true);
    try {
      await onSubmit(fileIndex, selectedFile, selectedFile.name);
      setSelectedFile(null);
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to upload file"
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Replace File</DialogTitle>
          <DialogDescription>
            Upload a new version of: <span className="font-semibold text-foreground">{fileName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center space-y-3">
            {!selectedFile ? (
              <>
                <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                <div>
                  <label className="cursor-pointer">
                    <span className="text-sm font-medium text-primary hover:underline">
                      Click to select file
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileSelect}
                      disabled={uploading}
                    />
                  </label>
                  <p className="text-xs text-muted-foreground mt-1">
                    or drag and drop your file here
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supported: PDF, JPEG, JPG
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Max file size: 10MB
                  </p>
                </div>
              </>
            ) : (
              <>
                <File className="h-8 w-8 mx-auto text-green-600" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                  <label className="inline-block">
                    <span className="text-sm text-primary hover:underline cursor-pointer">
                      Choose different file
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileSelect}
                      disabled={uploading}
                    />
                  </label>
                </div>
              </>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedFile || uploading}
            className="btn-primary-meo"
          >
            {uploading ? "Uploading..." : "Upload File"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
