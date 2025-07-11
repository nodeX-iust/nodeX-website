"use client";

import React, { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import ReCAPTCHA from "react-google-recaptcha";
import { useActivityLogger } from "@/hooks/useActivityLogger";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  batch: z.string().min(4, "Please enter your batch year"),
  rollNumber: z.string().min(1, "Roll number is required"),
  registrationNumber: z.string().min(1, "Registration number is required"),
  department: z.string().min(1, "Please select a department"),
  interestedTracks: z
    .array(z.string())
    .min(1, "Please select at least one track"),
  whyJoin: z
    .string()
    .min(
      50,
      "Please provide at least 50 characters explaining why you want to join"
    ),
  experience: z.string().optional(),
  projects: z.string().optional(),
  otherRemarks: z.string().optional(),
  recaptchaToken: z.string().min(1, "reCAPTCHA verification is required"),
});

type FormData = z.infer<typeof formSchema>;

const departments = [
  "Computer Science and Engineering",
  "Robotics and Automation",
  "Electronics and Communication Engineering",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Other",
];

const tracks = ["Coding & Development", "Postgraduate Prep", "Hardware & IoT"];

export function JoinForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });
  const { logActivity } = useActivityLogger({
    trackPageViews: true,
    trackFormSubmissions: true,
  });
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      batch: "",
      rollNumber: "",
      registrationNumber: "",
      department: "",
      interestedTracks: [],
      whyJoin: "",
      experience: "",
      projects: "",
      otherRemarks: "",
      recaptchaToken: "",
    },
  });

  async function onSubmit(values: FormData) {
    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: "" });

    try {
      // Get reCAPTCHA token
      const token = recaptchaRef.current?.getValue();
      if (!token) {
        setSubmitStatus({
          type: "error",
          message: "Please complete the reCAPTCHA verification.",
        });
        setIsSubmitting(false);
        return;
      }

      // Include token in submission
      const submissionData = {
        ...values,
        recaptchaToken: token,
      };

      const response = await fetch("/api/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitStatus({
          type: "success",
          message: data.message || "Application submitted successfully!",
        });
        await logActivity("join_form_success", {
          applicationId: data.applicationId,
        });
        form.reset();
        recaptchaRef.current?.reset();
      } else if (response.status === 303 && data.redirect) {
        // Handle redirect response (for blocked IPs)
        await logActivity("join_form_blocked", {
          reason: "blocked_ip",
        });
        window.location.href = data.redirect;
        return;
      } else {
        setSubmitStatus({
          type: "error",
          message:
            data.message || "Failed to submit application. Please try again.",
        });
        await logActivity("join_form_error", {
          error_type: "validation_or_server_error",
          status_code: response.status,
        });
        recaptchaRef.current?.reset();
      }
    } catch (err) {
      console.error("Form submission error:", err);
      setSubmitStatus({
        type: "error",
        message: "Network error. Please check your connection and try again.",
      });
      await logActivity("join_form_error", {
        error_type: "network_error",
        error: err instanceof Error ? err.message : "unknown_error",
      });
      recaptchaRef.current?.reset();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Join NodeX</CardTitle>
        <CardDescription>
          Fill out this form to apply for membership in our tech community. We
          welcome students from all backgrounds and skill levels.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {submitStatus.type && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              submitStatus.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {submitStatus.type === "success" ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <p>{submitStatus.message}</p>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Personal Information</h3>

              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="your.email@example.com"
                          type="email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number *</FormLabel>
                      <FormControl>
                        <Input placeholder="+91 9876543210" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="batch"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Batch Year *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 2024" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Academic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Academic Information</h3>

              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="rollNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Roll Number *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your roll number"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="registrationNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Registration Number *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your registration number"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Interests */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Areas of Interest</h3>

              <FormField
                control={form.control}
                name="interestedTracks"
                render={() => (
                  <FormItem>
                    <FormLabel>Which tracks interest you? *</FormLabel>
                    <FormDescription>
                      Select all tracks you&apos;d like to participate in
                    </FormDescription>
                    <div className="space-y-3">
                      {tracks.map((track) => (
                        <FormField
                          key={track}
                          control={form.control}
                          name="interestedTracks"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={track}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(track)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([
                                            ...field.value,
                                            track,
                                          ])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== track
                                            )
                                          );
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {track}
                                </FormLabel>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Motivations and Experience */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Tell Us About Yourself</h3>

              <FormField
                control={form.control}
                name="whyJoin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Why do you want to join NodeX? *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us about your motivations, goals, and what you hope to achieve by joining our community..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Minimum 50 characters. Share your goals and what excites
                      you about joining.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="experience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Previous Experience (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us about your programming experience, previous projects, internships, or relevant background..."
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Any coding experience, hackathons, courses, or
                      tech-related activities.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="projects"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notable Projects (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe any projects you've worked on, including GitHub links if available..."
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Personal projects, college assignments, or collaborative
                      work.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="otherRemarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Remarks (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any other information you'd like us to know..."
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Questions, special circumstances, or anything else
                      you&apos;d like to share.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="mb-4">
              <FormLabel className="block mb-2">
                reCAPTCHA Verification *
              </FormLabel>
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={
                  process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ||
                  "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
                } // Default is Google's test key
                onChange={(token) => {
                  form.setValue("recaptchaToken", token || "");
                }}
              />
              {form.formState.errors.recaptchaToken && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.recaptchaToken.message}
                </p>
              )}
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting Application...
                </>
              ) : (
                "Submit Application"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
