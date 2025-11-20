"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface AddProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddProjectDialog({ open, onOpenChange }: AddProjectDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    projectName: "",
    protocolName: "",
    website: "",
    contactEmail: "",
    description: "",
    tvl: "",
    apy: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/submit-project", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        // Reset form
        setFormData({
          projectName: "",
          protocolName: "",
          website: "",
          contactEmail: "",
          description: "",
          tvl: "",
          apy: "",
        });
        onOpenChange(false);
        alert("Project submitted successfully! We will review it shortly.");
      } else {
        alert("Failed to submit project. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting project:", error);
      alert("Failed to submit project. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Your Project</DialogTitle>
          <DialogDescription>
            Submit your project details to be listed on Yields.to. We&rsquo;ll review and add it if it meets our criteria.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="projectName">
              Project Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="projectName"
              required
              value={formData.projectName}
              onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
              placeholder="e.g., Plasma Vaults"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="protocolName">
              Protocol Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="protocolName"
              required
              value={formData.protocolName}
              onChange={(e) => setFormData({ ...formData, protocolName: e.target.value })}
              placeholder="e.g., Aave, Pendle, etc."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">
              Website URL <span className="text-destructive">*</span>
            </Label>
            <Input
              id="website"
              type="url"
              required
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactEmail">
              Contact Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="contactEmail"
              type="email"
              required
              value={formData.contactEmail}
              onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              placeholder="contact@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of your project and what makes it unique..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tvl">TVL (USD)</Label>
              <Input
                id="tvl"
                value={formData.tvl}
                onChange={(e) => setFormData({ ...formData, tvl: e.target.value })}
                placeholder="e.g., 1000000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apy">APY (%)</Label>
              <Input
                id="apy"
                value={formData.apy}
                onChange={(e) => setFormData({ ...formData, apy: e.target.value })}
                placeholder="e.g., 5.5"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
