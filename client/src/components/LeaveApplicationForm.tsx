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

const formSchema = insertLeaveRequestSchema;

type FormData = z.infer<typeof formSchema>;

export default function LeaveApplicationForm() {
  const { userData } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      student_id: userData?.id || "",
      leave_type: "",
      reason: "",
      start_date: "",
      end_date: "",
      guardian_phone: "",
      emergency_contact: "",
      supporting_docs: "",
      is_hostel_student: false,
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
              value={form.watch("leave_type")} 
              onValueChange={(value) => form.setValue("leave_type", value)}
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
            {form.formState.errors.leave_type && (
              <p className="text-sm text-destructive">{form.formState.errors.leave_type.message}</p>
            )}
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">From Date</Label>
              <Input
                id="start_date"
                type="date"
                {...form.register("start_date")}
                data-testid="input-from-date"
              />
              {form.formState.errors.start_date && (
                <p className="text-sm text-destructive">{form.formState.errors.start_date.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">To Date</Label>
              <Input
                id="end_date"
                type="date"
                {...form.register("end_date")}
                data-testid="input-to-date"
              />
              {form.formState.errors.end_date && (
                <p className="text-sm text-destructive">{form.formState.errors.end_date.message}</p>
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

          {/* Guardian Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="guardian_phone">Guardian Phone Number *</Label>
            <Input
              id="guardian_phone"
              type="tel"
              placeholder="+91 9876543210"
              {...form.register("guardian_phone")}
              data-testid="input-guardian-phone"
            />
            {form.formState.errors.guardian_phone && (
              <p className="text-sm text-destructive">{form.formState.errors.guardian_phone.message}</p>
            )}
          </div>

          {/* Hostel Student Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_hostel_student"
              checked={form.watch("is_hostel_student") || false}
              onCheckedChange={(checked) => form.setValue("is_hostel_student", !!checked)}
              data-testid="checkbox-hostel-student"
            />
            <Label htmlFor="is_hostel_student">I am a hostel student</Label>
          </div>

          {/* Emergency Contact */}
          <div className="space-y-2">
            <Label htmlFor="emergency_contact">Emergency Contact Number</Label>
            <Input
              id="emergency_contact"
              type="tel"
              placeholder="+91 9876543210"
              {...form.register("emergency_contact")}
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
