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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { DocumentUpload } from "./DocumentUpload";
import { cn } from "@/lib/utils";

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
  disabled?: boolean;
}

const STEPS = [
  { id: "describe", label: "Describe", icon: FileText },
  { id: "amount", label: "Amount", icon: Coins },
  { id: "proof", label: "Proof", icon: Shield },
] as const;

type StepId = (typeof STEPS)[number]["id"];

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
    <Card>
      <CardHeader>
        <CardTitle>Request Help</CardTitle>
        <CardDescription>
          Describe your situation, set an amount, and attach proof.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        {/* Step indicators */}
        <div className="flex items-center gap-2">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const isActive = i === currentStep;
            const isPast = i < currentStep;

            return (
              <div key={step.id} className="flex flex-1 items-center gap-2 last:flex-none">
                <button
                  type="button"
                  onClick={() => {
                    if (isPast) {
                      setDirection(i < currentStep ? -1 : 1);
                      setCurrentStep(i);
                    }
                  }}
                  disabled={!isPast}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all",
                    isActive &&
                      "bg-primary/10 text-primary ring-1 ring-primary/20",
                    isPast &&
                      "cursor-pointer text-primary/70 hover:bg-primary/5",
                    !isActive && !isPast && "text-muted-foreground"
                  )}
                >
                  <Icon className={cn(isActive && "text-primary")} />
                  <span className="hidden sm:inline">{step.label}</span>
                </button>

                {i < STEPS.length - 1 && (
                  <div className="h-px flex-1">
                    <div
                      className={cn(
                        "h-full transition-colors",
                        isPast ? "bg-primary/40" : "bg-border"
                      )}
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
                    <Label htmlFor="request-description">
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
                      className="resize-none"
                    />
                    <p className="text-right text-xs text-muted-foreground">
                      {description.length}/1000
                    </p>
                  </div>
                </div>
              )}

              {/* Step 2: Amount */}
              {currentStep === 1 && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="request-amount">Amount (XRP)</Label>
                    <Input
                      id="request-amount"
                      type="number"
                      placeholder="0.00"
                      value={amountXRP}
                      onChange={(e) => setAmountXRP(e.target.value)}
                      disabled={disabled}
                      min="0"
                      step="0.000001"
                    />
                  </div>

                  {/* Info rows */}
                  <div className="flex flex-col gap-2 rounded-lg bg-muted/50 p-3">
                    {maxAmount !== undefined && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          Your max request
                        </span>
                        <span className="font-mono font-medium">
                          {dropsToXRP(maxAmount)} XRP
                        </span>
                      </div>
                    )}
                    {totalContributed !== undefined &&
                      requestCapMultiplier !== undefined && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            Based on {dropsToXRP(totalContributed)} contributed
                            &times; {requestCapMultiplier}
                          </span>
                        </div>
                      )}
                    {poolBalance !== undefined &&
                      maxPoolPercent !== undefined && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            Pool limit ({(maxPoolPercent * 100).toFixed(0)}% of pool)
                          </span>
                          <span className="font-mono font-medium">
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
                      className="flex items-center gap-2 text-sm text-destructive"
                    >
                      <AlertCircle className="shrink-0" />
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
                    <Label>Attach supporting document</Label>
                    <p className="text-sm text-muted-foreground">
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
            className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
          >
            <AlertCircle className="shrink-0" />
            <span>{submitError}</span>
          </motion.div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={goBack}
            disabled={currentStep === 0 || isSubmitting}
          >
            <ArrowLeft data-icon="inline-start" />
            Back
          </Button>

          {isLastStep ? (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!canProceedFromStep(currentStep) || isSubmitting || disabled}
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" data-icon="inline-start" />
              ) : (
                <Shield data-icon="inline-start" />
              )}
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={goNext}
              disabled={!canProceedFromStep(currentStep) || disabled}
            >
              Next
              <ArrowRight data-icon="inline-end" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
