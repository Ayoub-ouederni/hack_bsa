"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Coins,
  Shield,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DocumentUpload } from "./DocumentUpload";

export interface RequestFormData {
  description: string;
  amount: number;
  documentHash: string;
  documentName: string;
}

export interface RequestFormProps {
  maxAmount?: number;
  poolBalance?: number;
  maxPoolPercent?: number;
  requestCapMultiplier?: number;
  totalContributed?: number;
  onSubmit: (data: RequestFormData) => Promise<void>;
  onBack?: () => void;
  disabled?: boolean;
}

const STEPS = [
  { id: "describe", label: "Describe", icon: FileText },
  { id: "amount", label: "Amount", icon: Coins },
  { id: "proof", label: "Proof", icon: Shield },
] as const;

function dropsToXRP(drops: number): string {
  return (drops / 1_000_000).toFixed(6).replace(/\.?0+$/, "");
}

export function RequestForm({
  maxAmount,
  poolBalance,
  maxPoolPercent,
  requestCapMultiplier,
  totalContributed,
  onSubmit,
  onBack,
  disabled = false,
}: RequestFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [description, setDescription] = useState("");
  const [amountXRP, setAmountXRP] = useState("");
  const [documentHash, setDocumentHash] = useState("");
  const [documentName, setDocumentName] = useState("");

  const amountDrops = Math.floor(parseFloat(amountXRP || "0") * 1_000_000);

  const canProceedFromStep = useCallback(
    (step: number): boolean => {
      switch (step) {
        case 0:
          return description.trim().length >= 1 && description.length <= 1000;
        case 1:
          return (
            amountDrops > 0 && (!maxAmount || amountDrops <= maxAmount)
          );
        case 2:
          return documentHash.length === 64;
        default:
          return false;
      }
    },
    [description, amountDrops, maxAmount, documentHash]
  );

  const goNext = () => {
    if (currentStep < STEPS.length - 1) {
      setDirection(1);
      setCurrentStep((s) => s + 1);
    }
  };

  const goBack = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep((s) => s - 1);
    } else if (onBack) {
      onBack();
    }
  };

  const handleSubmit = async () => {
    if (!canProceedFromStep(2)) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit({
        description: description.trim(),
        amount: amountDrops,
        documentHash,
        documentName,
      });
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to submit request"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHashGenerated = useCallback(
    (hash: string, name: string) => {
      setDocumentHash(hash);
      setDocumentName(name);
    },
    []
  );

  const isLastStep = currentStep === STEPS.length - 1;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-[#1A1A2E] mb-1">
        Request Help
      </h3>
      <p className="text-sm text-[#6B7280] mb-6">
        Describe your situation, set an amount, and attach proof.
      </p>

      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-6">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const isActive = i === currentStep;
          const isPast = i < currentStep;

          return (
            <div
              key={step.id}
              className="flex flex-1 items-center gap-2 last:flex-none"
            >
              <button
                type="button"
                onClick={() => {
                  if (isPast) {
                    setDirection(i < currentStep ? -1 : 1);
                    setCurrentStep(i);
                  }
                }}
                disabled={!isPast}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                  isActive
                    ? "bg-[#FFF9E6] text-[#F5A623] ring-1 ring-[#F5A623]/20"
                    : isPast
                      ? "cursor-pointer text-[#F5A623]/70 hover:bg-[#FFF9E6]/50"
                      : "text-[#6B7280]"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-[#F5A623]" : ""}`} />
                <span className="hidden sm:inline">{step.label}</span>
              </button>

              {i < STEPS.length - 1 && (
                <div className="h-px flex-1">
                  <div
                    className={`h-full transition-colors ${
                      isPast ? "bg-[#F5A623]/40" : "bg-gray-200"
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <div className="relative min-h-[200px]">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            initial={{ opacity: 0, x: direction * 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -30 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            {/* Step 1: Description */}
            {currentStep === 0 && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label
                    htmlFor="request-description"
                    className="text-sm font-medium text-[#1A1A2E]"
                  >
                    What happened?
                  </Label>
                  <Textarea
                    id="request-description"
                    placeholder="Describe your emergency situation..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={disabled}
                    rows={5}
                    maxLength={1000}
                    className="resize-none rounded-xl border-gray-200 focus:border-[#F5A623] focus:ring-[#F5A623]/20"
                  />
                  <p className="text-right text-xs text-[#6B7280]">
                    {description.length}/1000
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Amount */}
            {currentStep === 1 && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label
                    htmlFor="request-amount"
                    className="text-sm font-medium text-[#1A1A2E]"
                  >
                    Amount (XRP)
                  </Label>
                  <Input
                    id="request-amount"
                    type="number"
                    placeholder="0.00"
                    value={amountXRP}
                    onChange={(e) => setAmountXRP(e.target.value)}
                    disabled={disabled}
                    min="0"
                    step="0.000001"
                    className="rounded-xl border-gray-200 focus:border-[#F5A623] focus:ring-[#F5A623]/20"
                  />
                </div>

                {/* Info rows */}
                <div className="flex flex-col gap-2 rounded-xl bg-[#FAFAFA] border border-gray-100 p-4">
                  {maxAmount !== undefined && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#6B7280]">Your max request</span>
                      <span className="font-mono font-medium text-[#1A1A2E]">
                        {dropsToXRP(maxAmount)} XRP
                      </span>
                    </div>
                  )}
                  {totalContributed !== undefined &&
                    requestCapMultiplier !== undefined && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#6B7280]">
                          Based on {dropsToXRP(totalContributed)} contributed
                          &times; {requestCapMultiplier}
                        </span>
                      </div>
                    )}
                  {poolBalance !== undefined &&
                    maxPoolPercent !== undefined && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#6B7280]">
                          Pool limit ({(maxPoolPercent * 100).toFixed(0)}% of
                          pool)
                        </span>
                        <span className="font-mono font-medium text-[#1A1A2E]">
                          {dropsToXRP(
                            Math.floor(poolBalance * maxPoolPercent)
                          )}{" "}
                          XRP
                        </span>
                      </div>
                    )}
                </div>

                {maxAmount !== undefined && amountDrops > maxAmount && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 text-sm text-red-500"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>
                      Exceeds your maximum of {dropsToXRP(maxAmount)} XRP
                    </span>
                  </motion.div>
                )}
              </div>
            )}

            {/* Step 3: Document proof */}
            {currentStep === 2 && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label className="text-sm font-medium text-[#1A1A2E]">
                    Attach supporting document
                  </Label>
                  <p className="text-sm text-[#6B7280]">
                    Upload a document that supports your request (invoice,
                    medical bill, photo, etc.).
                  </p>
                </div>
                <DocumentUpload
                  onHashGenerated={handleHashGenerated}
                  hash={documentHash}
                  fileName={documentName}
                  disabled={disabled || isSubmitting}
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Error */}
      {submitError && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-500 mt-4"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{submitError}</span>
        </motion.div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
        <Button
          type="button"
          variant="ghost"
          onClick={goBack}
          disabled={(currentStep === 0 && !onBack) || isSubmitting}
          className="text-[#6B7280] hover:text-[#1A1A2E] hover:bg-gray-50 rounded-xl"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>

        {isLastStep ? (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={
              !canProceedFromStep(currentStep) || isSubmitting || disabled
            }
            className="bg-[#F5A623] hover:bg-[#E09000] text-white rounded-xl gap-1.5"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Shield className="h-4 w-4" />
            )}
            {isSubmitting ? "Submitting..." : "Submit Request"}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={goNext}
            disabled={!canProceedFromStep(currentStep) || disabled}
            className="bg-[#F5A623] hover:bg-[#E09000] text-white rounded-xl gap-1.5"
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
