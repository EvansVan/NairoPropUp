import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertMeetingRequestSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { InsertMeetingRequest } from "@shared/schema";

export default function MeetingRequestForm({ onSuccess }: { onSuccess?: () => void }) {
  const { toast } = useToast();
  
  const form = useForm<InsertMeetingRequest>({
    resolver: zodResolver(insertMeetingRequestSchema),
    defaultValues: {
      name: "",
      email: "",
      appointmentDate: "",
      appointmentTime: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertMeetingRequest) => {
      const res = await apiRequest("POST", "/api/meeting-requests", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Meeting Request Submitted",
        description: "We'll get back to you shortly to confirm your appointment.",
      });
      form.reset();
      onSuccess?.();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit meeting request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertMeetingRequest) => {
    mutation.mutate(data);
  };

  const dates = [
    { value: "2025-10-15", label: "October 15, 2025" },
    { value: "2025-10-16", label: "October 16, 2025" },
    { value: "2025-10-17", label: "October 17, 2025" },
    { value: "2025-10-20", label: "October 20, 2025" },
    { value: "2025-10-21", label: "October 21, 2025" },
  ];

  const times = [
    { value: "09:00", label: "9:00 AM" },
    { value: "10:00", label: "10:00 AM" },
    { value: "11:00", label: "11:00 AM" },
    { value: "14:00", label: "2:00 PM" },
    { value: "15:00", label: "3:00 PM" },
    { value: "16:00", label: "4:00 PM" },
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Your name" 
                  {...field} 
                  data-testid="input-name"
                />
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
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input 
                  type="email"
                  placeholder="your@email.com" 
                  {...field} 
                  data-testid="input-email"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="appointmentDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Appointment Date</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-date">
                    <SelectValue placeholder="Select a date" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {dates.map((date) => (
                    <SelectItem key={date.value} value={date.value}>
                      {date.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="appointmentTime"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Appointment Time</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-time">
                    <SelectValue placeholder="Select a time" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {times.map((time) => (
                    <SelectItem key={time.value} value={time.value}>
                      {time.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          className="w-full" 
          disabled={mutation.isPending}
          data-testid="button-submit-meeting"
        >
          {mutation.isPending ? "Submitting..." : "Book Appointment"}
        </Button>
      </form>
    </Form>
  );
}
