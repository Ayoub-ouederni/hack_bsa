"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, X, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface DocumentUploadProps {
  onHashGenerated: (hash: string, fileName: string) => void;
  hash?: string;
  fileName?: string;
  disabled?: boolean;
}

async function computeSHA256(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function DocumentUpload({
  onHashGenerated,
  hash,
  fileName,
  disabled = false,
}: DocumentUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isHashing, setIsHashing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    async (file: File) => {
      setError(null);

      if (file.size > 10 * 1024 * 1024) {
        setError("File must be under 10 MB");
        return;
      }

      setIsHashing(true);
      try {
        const fileHash = await computeSHA256(file);
        onHashGenerated(fileHash, file.name);
      } catch {
        setError("Failed to process file");
      } finally {
        setIsHashing(false);
      }
    },
    [onHashGenerated]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (disabled) return;

      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [disabled, processFile]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
      if (inputRef.current) inputRef.current.value = "";
    },
    [processFile]
  );

  const handleClear = useCallback(() => {
    onHashGenerated("", "");
    setError(null);
  }, [onHashGenerated]);

  const hasFile = !!hash && !!fileName;

  return (
    <div className="flex flex-col gap-2">
      <AnimatePresence mode="wait">
        {hasFile ? (
          <motion.div
            key="file-attached"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[#1A1A2E]">
                {fileName}
              </p>
              <p className="truncate font-mono text-xs text-[#6B7280]">
                SHA-256: {hash?.slice(0, 16)}...
              </p>
            </div>
            {!disabled && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-[#6B7280] hover:text-red-500 rounded-lg"
                onClick={handleClear}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="upload-zone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              onDragOver={(e) => {
                e.preventDefault();
                if (!disabled) setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() =>
                !disabled && !isHashing && inputRef.current?.click()
              }
              className={`group flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed p-8 transition-all ${
                isDragOver
                  ? "border-[#F5A623] bg-[#FFF9E6]"
                  : "border-gray-200 hover:border-[#F5A623]/40 hover:bg-[#FFF9E6]/30"
              } ${disabled ? "cursor-not-allowed opacity-50" : ""} ${
                isHashing ? "pointer-events-none" : ""
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
                disabled={disabled}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt"
              />

              {isHashing ? (
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="flex flex-col items-center gap-2"
                >
                  <Loader2 className="h-8 w-8 animate-spin text-[#F5A623]" />
                  <p className="text-sm text-[#6B7280]">Generating proof...</p>
                </motion.div>
              ) : (
                <>
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${
                      isDragOver
                        ? "bg-[#F5A623]/20 text-[#F5A623]"
                        : "bg-[#F3F4F6] text-[#6B7280] group-hover:bg-[#FFF9E6] group-hover:text-[#F5A623]"
                    }`}
                  >
                    {isDragOver ? (
                      <FileText className="h-6 w-6" />
                    ) : (
                      <Upload className="h-6 w-6" />
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-[#1A1A2E]">
                      Drop a file or click to upload
                    </p>
                    <p className="mt-1 text-xs text-[#6B7280]">
                      PDF, image, or document — max 10 MB
                    </p>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-red-500"
        >
          {error}
        </motion.p>
      )}

      {!hasFile && (
        <p className="text-xs text-[#6B7280]">
          Your file never leaves your device — only its cryptographic
          fingerprint is stored securely.
        </p>
      )}
    </div>
  );
}
