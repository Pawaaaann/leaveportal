import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { insertLeaveRequestSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { z } from "zod";

const formSchema = insertLeaveRequestSchema.extend({
  fromDate: z.string().min(1, "From date is required"),
  toDate: z.string().min(1, "To date is required"),
});

type FormData = z.infer<typeof formSchema>;

export default function LeaveApplicationForm() {
  const { userData } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      studentId: userData?.id || "",
      leaveType: "",
      reason: "",
      fromDate: "",
      toDate: "",
      emergencyContact: "",
      supportingDocs: "",
      isHostelStudent: false,
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", "/api/leave-requests", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Leave application submitted successfully",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/leave-requests"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit leave application",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    submitMutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Apply for Leave</CardTitle>
        <CardDescription>Fill out the form below to submit a new leave request</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Leave Type */}
          <div className="space-y-2">
            <Label htmlFor="leaveType">Leave Type</Label>
            <Select 
              value={form.watch("leaveType")} 
              onValueChange={(value) => form.setValue("leaveType", value)}
            >
              <SelectTrigger data-testid="select-leave-type">
                <SelectValue placeholder="Select leave type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="medical">Medical Leave</SelectItem>
                <SelectItem value="personal">Personal Leave</SelectItem>
                <SelectItem value="emergency">Emergency Leave</SelectItem>
                <SelectItem value="family">Family Function</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.leaveType && (
              <p className="text-sm text-destructive">{form.formState.errors.leaveType.message}</p>
            )}
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fromDate">From Date</Label>
              <Input
                id="fromDate"
                type="date"
                {...form.register("fromDate")}
                data-testid="input-from-date"
              />
              {form.formState.errors.fromDate && (
                <p className="text-sm text-destructive">{form.formState.errors.fromDate.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="toDate">To Date</Label>
              <Input
                id="toDate"
                type="date"
                {...form.register("toDate")}
                data-testid="input-to-date"
              />
              {form.formState.errors.toDate && (
                <p className="text-sm text-destructive">{form.formState.errors.toDate.message}</p>
              )}
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Leave</Label>
            <Textarea
              id="reason"
              rows={4}
              placeholder="Provide detailed reason for your leave request..."
              {...form.register("reason")}
              data-testid="textarea-reason"
            />
            {form.formState.errors.reason && (
              <p className="text-sm text-destructive">{form.formState.errors.reason.message}</p>
            )}
          </div>

          {/* Hostel Student Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isHostelStudent"
              checked={form.watch("isHostelStudent") || false}
              onCheckedChange={(checked) => form.setValue("isHostelStudent", !!checked)}
              data-testid="checkbox-hostel-student"
            />
            <Label htmlFor="isHostelStudent">I am a hostel student</Label>
          </div>

          {/* Emergency Contact */}
          <div className="space-y-2">
            <Label htmlFor="emergencyContact">Emergency Contact Number</Label>
            <Input
              id="emergencyContact"
              type="tel"
              placeholder="+91 9876543210"
              {...form.register("emergencyContact")}
              data-testid="input-emergency-contact"
            />
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={submitMutation.isPending}
            data-testid="button-submit-leave"
          >
            {submitMutation.isPending ? "Submitting..." : "Submit Leave Application"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
