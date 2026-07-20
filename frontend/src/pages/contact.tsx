import { MessageSquareText, Send, ShieldQuestion } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { sendContactMessage } from "../api/student";
import { Button } from "../components/ui/button";
import { PageHeading } from "../components/ui/page-heading";
import { getErrorMessage } from "../utils/errors";

interface ContactForm { name: string; email: string; subject: string; message: string; }
const inputClass = "focus-ring mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm dark:border-white/12 dark:bg-white/5";

export const ContactPage = () => {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ContactForm>();
  const submit = async (values: ContactForm) => {
    try {
      await sendContactMessage(values);
      toast.success("Your message has been sent");
      reset();
    } catch (error) {
      toast.error(getErrorMessage(error, "Your message could not be sent."));
    }
  };
  return (
    <section className="page-shell py-16 sm:py-24">
      <PageHeading eyebrow="Contact" title="Need help with your event pass?" description="Send the event support team a clear message. Include your registration ID in the message when asking about an existing registration." />
      <div className="mx-auto mt-12 grid max-w-5xl gap-6 lg:grid-cols-[.72fr_1.28fr]">
        <div className="space-y-4">
          <div className="surface rounded-2xl p-6"><MessageSquareText className="text-emerald-700 dark:text-mint-300" /><h2 className="mt-4 font-display text-xl font-bold">Registration support</h2><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Use this form for document, status, QR, or entry-related questions. The message is routed through the EventPass support API.</p></div>
          <div className="surface rounded-2xl p-6"><ShieldQuestion className="text-emerald-700 dark:text-mint-300" /><h2 className="mt-4 font-display text-xl font-bold">Urgent event-day help</h2><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">For immediate venue assistance, contact the authorized event desk at your college. Do not send identity documents through this message form.</p></div>
        </div>
        <form onSubmit={(event) => void handleSubmit(submit)(event)} className="surface rounded-[2rem] p-6 sm:p-8">
          <div className="grid gap-5 sm:grid-cols-2">
            <div><label htmlFor="contactName" className="text-sm font-bold">Name</label><input id="contactName" className={inputClass} autoComplete="name" {...register("name", { required: "Name is required" })} />{errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name.message}</p>}</div>
            <div><label htmlFor="contactEmail" className="text-sm font-bold">Email</label><input id="contactEmail" className={inputClass} type="email" autoComplete="email" {...register("email", { required: "Email is required", pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter a valid email" } })} />{errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p>}</div>
            <div className="sm:col-span-2"><label htmlFor="subject" className="text-sm font-bold">Subject</label><input id="subject" className={inputClass} {...register("subject", { required: "Subject is required", maxLength: { value: 160, message: "Subject is too long" } })} />{errors.subject && <p className="mt-1 text-xs text-rose-600">{errors.subject.message}</p>}</div>
            <div className="sm:col-span-2"><label htmlFor="message" className="text-sm font-bold">Message</label><textarea id="message" rows={7} className={`${inputClass} py-3`} {...register("message", { required: "Message is required", minLength: { value: 10, message: "Please provide more detail" }, maxLength: { value: 3000, message: "Message is too long" } })} />{errors.message && <p className="mt-1 text-xs text-rose-600">{errors.message.message}</p>}</div>
          </div>
          <Button type="submit" loading={isSubmitting} className="mt-6 w-full sm:w-auto">Send message <Send size={16} /></Button>
        </form>
      </div>
    </section>
  );
};
