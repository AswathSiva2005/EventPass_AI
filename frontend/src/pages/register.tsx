import { AlertCircle, ArrowRight, FileCheck2, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { createRegistration, getColleges, getDepartments } from "../api/student";
import { Button } from "../components/ui/button";
import { FileUpload } from "../components/ui/file-upload";
import { PageHeading } from "../components/ui/page-heading";
import { useUpcomingEvents } from "../hooks/use-upcoming-events";
import type { College, Department } from "../types/api";
import { getErrorMessage } from "../utils/errors";

interface RegistrationForm {
  event: string;
  name: string;
  rollNumber: string;
  college: string;
  department: string;
  year: string;
  phone: string;
  email: string;
  emergencyName: string;
  emergencyRelationship: string;
  emergencyPhone: string;
  selfie?: File;
  idFront?: File;
  idBack?: File;
  consent: boolean;
}

const inputClass = "focus-ring mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-ink-950 placeholder:text-slate-400 dark:border-white/12 dark:bg-white/5 dark:text-white";
const labelClass = "text-sm font-bold text-ink-950 dark:text-white";

export const RegisterPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { events, isLoading: eventsLoading, error: eventsError } = useUpcomingEvents();
  const [colleges, setColleges] = useState<College[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [referenceLoading, setReferenceLoading] = useState(true);
  const fileHashCache = useRef(new WeakMap<File, string>());
  const {
    register,
    handleSubmit,
    control,
    getValues,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<RegistrationForm>({
    defaultValues: { event: searchParams.get("event") ?? "", consent: false }
  });
  const collegeId = useWatch({ control, name: "college" });
  const eventId = useWatch({ control, name: "event" });
  const idFrontFile = useWatch({ control, name: "idFront" });
  const idBackFile = useWatch({ control, name: "idBack" });

  useEffect(() => {
    register("selfie", { validate: (file) => file instanceof File || "A clear selfie is required" });
    register("idFront", { validate: (file) => file instanceof File || "College ID front is required" });
    register("idBack", { validate: (file) => file instanceof File || "College ID back is required" });
  }, [register]);

  useEffect(() => {
    getColleges()
      .then(setColleges)
      .catch((error: unknown) => toast.error(getErrorMessage(error, "Unable to load colleges.")))
      .finally(() => setReferenceLoading(false));
  }, []);

  useEffect(() => {
    if (!collegeId) return;
    getDepartments(collegeId)
      .then(setDepartments)
      .catch((error: unknown) => toast.error(getErrorMessage(error, "Unable to load departments.")));
  }, [collegeId]);

  const selectedEvent = useMemo(() => events.find((event) => event._id === eventId), [eventId, events]);
  const selectedEventCollegeId =
    selectedEvent?.college && typeof selectedEvent.college !== "string"
      ? selectedEvent.college._id
      : typeof selectedEvent?.college === "string"
        ? selectedEvent.college
        : "";
  const selectedEventDepartments = useMemo(() => selectedEvent?.departments ?? [], [selectedEvent]);

  const fingerprintFile = async (file: File) => {
    const cached = fileHashCache.current.get(file);
    if (cached) {
      return cached;
    }

    const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
    const signature = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
    fileHashCache.current.set(file, signature);
    return signature;
  };

  const ensureDistinctIdCard = async (selected: File, existing?: File) => {
    if (!existing) {
      return;
    }

    if (selected.size !== existing.size || selected.type !== existing.type) {
      return;
    }

    const [selectedHash, existingHash] = await Promise.all([fingerprintFile(selected), fingerprintFile(existing)]);
    if (selectedHash === existingHash) {
      return "Front and back ID photos must be different.";
    }
  };

  useEffect(() => {
    if (!selectedEvent) return;

    if (selectedEventCollegeId) {
      setValue("college", selectedEventCollegeId, { shouldDirty: false, shouldValidate: true });
    }

    if (selectedEventDepartments.length === 1) {
      const onlyDepartment = selectedEventDepartments[0];
      if (onlyDepartment) {
        setValue("department", onlyDepartment._id, { shouldDirty: false, shouldValidate: true });
      }
      return;
    }

    const currentDepartment = getValues("department");
    if (currentDepartment && !selectedEventDepartments.some((department) => department._id === currentDepartment)) {
      setValue("department", "", { shouldDirty: false, shouldValidate: true });
    }
  }, [getValues, selectedEvent, selectedEventCollegeId, selectedEventDepartments, setValue]);

  const submit = async (values: RegistrationForm) => {
    const payload = new FormData();
    const fields: Array<[string, string]> = [
      ["event", values.event],
      ["name", values.name],
      ["rollNumber", values.rollNumber],
      ["college", values.college],
      ["department", values.department],
      ["year", values.year],
      ["phone", values.phone],
      ["email", values.email],
      ["emergencyContact[name]", values.emergencyName],
      ["emergencyContact[relationship]", values.emergencyRelationship],
      ["emergencyContact[phone]", values.emergencyPhone]
    ];
    fields.forEach(([key, value]) => payload.append(key, value));
    if (values.selfie) payload.append("selfie", values.selfie);
    if (values.idFront) payload.append("idFront", values.idFront);
    if (values.idBack) payload.append("idBack", values.idBack);

    try {
      const registration = await createRegistration(payload);
      toast.success("Registration submitted successfully");
      void navigate("/registration-success", { replace: true, state: registration });
    } catch (error) {
      toast.error(getErrorMessage(error, "Registration could not be submitted."));
    }
  };

  const fieldError = (name: keyof RegistrationForm) =>
    errors[name]?.message ? <p className="mt-1.5 text-xs font-semibold text-rose-600 dark:text-rose-300">{errors[name].message}</p> : null;
  const collegeField = register("college", {
    required: "Choose your college",
    validate: (value) =>
      !selectedEventCollegeId || value === selectedEventCollegeId || "This event is tied to a different college"
  });
  const departmentField = register("department", {
    required: "Choose your department",
    validate: (value) =>
      !selectedEventDepartments.length ||
      selectedEventDepartments.some((department) => department._id === value) ||
      "Choose one of the departments allowed for this event"
  });
  const visibleDepartments = selectedEventDepartments.length > 0 ? selectedEventDepartments : departments;
  const collegeLocked = Boolean(selectedEventCollegeId);
  const departmentLocked = selectedEventDepartments.length === 1;

  return (
    <section className="page-shell py-16 sm:py-24">
      <PageHeading
        eyebrow="Student registration"
        title="Create your verified event pass"
        description="Complete the form using accurate college details. Your documents are reviewed before the pass is approved."
      />
      {(eventsError || (!eventsLoading && events.length === 0)) && (
        <div className="mx-auto mt-10 flex max-w-3xl gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/8 dark:text-amber-200">
          <AlertCircle className="shrink-0" size={19} />
          {eventsError ?? "Registration cannot begin because no upcoming event is currently open."}
        </div>
      )}
      <form onSubmit={(event) => void handleSubmit(submit)(event)} className="surface mx-auto mt-10 max-w-4xl rounded-[2rem] p-5 sm:p-8">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-5 dark:border-white/10">
          <span className="grid size-11 place-items-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-mint-300/10 dark:text-mint-300">
            <FileCheck2 size={21} />
          </span>
          <div>
            <h2 className="font-display text-xl font-bold">Registration details</h2>
            <p className="mt-1 text-xs text-slate-500">Fields marked required must match your college ID.</p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="event">Choose event</label>
            <select id="event" className={inputClass} disabled={eventsLoading} {...register("event", { required: "Choose an event" })}>
              <option value="">{eventsLoading ? "Loading events..." : "Select an upcoming event"}</option>
              {events.map((event) => (
                <option key={event._id} value={event._id}>
                  {event.name} - {event.venue?.name || "Venue to be announced"}
                </option>
              ))}
            </select>
            {fieldError("event")}
            {selectedEvent && <p className="mt-2 text-xs text-slate-500">Registration closes {new Date(selectedEvent.registrationClosesAt).toLocaleString("en-IN")}.</p>}
          </div>
          <div>
            <label className={labelClass} htmlFor="name">Full name</label>
            <input
              id="name"
              className={inputClass}
              autoComplete="name"
              placeholder="As printed on your college ID"
              {...register("name", {
                required: "Full name is required",
                minLength: { value: 2, message: "Enter your full name" },
                maxLength: { value: 120, message: "Name is too long" }
              })}
            />
            {fieldError("name")}
          </div>
          <div>
            <label className={labelClass} htmlFor="rollNumber">Roll number</label>
            <input
              id="rollNumber"
              className={inputClass}
              autoCapitalize="characters"
              {...register("rollNumber", { required: "Roll number is required", minLength: { value: 2, message: "Roll number is too short" } })}
            />
            {fieldError("rollNumber")}
          </div>
          <div>
            <label className={labelClass} htmlFor="college">College</label>
            <select
              id="college"
              className={inputClass}
              disabled={referenceLoading || collegeLocked}
              {...collegeField}
              onChange={(event) => {
                void collegeField.onChange(event);
                setValue("department", "");
              }}
            >
              <option value="">{referenceLoading ? "Loading colleges..." : "Select college"}</option>
              {colleges.map((college) => (
                <option key={college._id} value={college._id}>
                  {college.name}
                </option>
              ))}
            </select>
            {fieldError("college")}
            {selectedEventCollegeId ? <p className="mt-1.5 text-xs text-slate-500">This event is linked to its admin-selected college.</p> : null}
          </div>
          <div>
            <label className={labelClass} htmlFor="department">Department</label>
            <select id="department" className={inputClass} disabled={!collegeId || departmentLocked} {...departmentField}>
              <option value="">Select department</option>
              {visibleDepartments.map((department) => (
                <option key={department._id} value={department._id}>
                  {department.name}
                </option>
              ))}
            </select>
            {fieldError("department")}
            {selectedEventDepartments.length > 0 ? <p className="mt-1.5 text-xs text-slate-500">Only the departments assigned to this event are available here.</p> : null}
          </div>
          <div>
            <label className={labelClass} htmlFor="year">Year of study</label>
            <select id="year" className={inputClass} {...register("year", { required: "Choose your year" })}>
              <option value="">Select year</option>
              {Array.from({ length: 8 }, (_, index) => (
                <option key={index + 1} value={index + 1}>
                  Year {index + 1}
                </option>
              ))}
            </select>
            {fieldError("year")}
          </div>
          <div>
            <label className={labelClass} htmlFor="phone">Phone</label>
            <input
              id="phone"
              className={inputClass}
              type="tel"
              autoComplete="tel"
              placeholder="+919876543210"
              {...register("phone", {
                required: "Phone number is required",
                pattern: { value: /^\+?[1-9]\d{7,14}$/, message: "Use a valid international phone number" }
              })}
            />
            {fieldError("phone")}
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="email">Email</label>
            <input
              id="email"
              className={inputClass}
              type="email"
              autoComplete="email"
              {...register("email", {
                required: "Email is required",
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter a valid email address" }
              })}
            />
            {fieldError("email")}
          </div>
        </div>

        <div className="mt-10 border-t border-slate-200 pt-8 dark:border-white/10">
          <h3 className="font-display text-lg font-bold">Emergency contact</h3>
          <div className="mt-5 grid gap-6 sm:grid-cols-3">
            <div>
              <label className={labelClass} htmlFor="emergencyName">Contact name</label>
              <input id="emergencyName" className={inputClass} {...register("emergencyName", { required: "Contact name is required" })} />
              {fieldError("emergencyName")}
            </div>
            <div>
              <label className={labelClass} htmlFor="emergencyRelationship">Relationship</label>
              <input id="emergencyRelationship" className={inputClass} {...register("emergencyRelationship", { required: "Relationship is required" })} />
              {fieldError("emergencyRelationship")}
            </div>
            <div>
              <label className={labelClass} htmlFor="emergencyPhone">Contact phone</label>
              <input
                id="emergencyPhone"
                className={inputClass}
                type="tel"
                placeholder="+919876543210"
                {...register("emergencyPhone", {
                  required: "Contact phone is required",
                  pattern: { value: /^\+?[1-9]\d{7,14}$/, message: "Enter a valid phone" }
                })}
              />
              {fieldError("emergencyPhone")}
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-200 pt-8 dark:border-white/10">
          <h3 className="font-display text-lg font-bold">Identity documents</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Selfie capture uses the front camera and is checked for a centered face before acceptance. ID uploads are checked to look like a real card with clear edges and readable contrast.
          </p>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            <FileUpload
              kind="selfie"
              label="Selfie"
              hint="Front camera only. Keep your face centered and fully visible."
              capture="user"
              error={errors.selfie?.message}
              onFile={(file) => setValue("selfie", file, { shouldValidate: true })}
            />
            <FileUpload
              kind="id-card"
              label="College ID - front"
              hint="Include all four corners and keep the card flat."
              capture="environment"
              error={errors.idFront?.message}
              validateSelection={(file) => ensureDistinctIdCard(file, idBackFile)}
              onFile={(file) => setValue("idFront", file, { shouldValidate: true })}
            />
            <FileUpload
              kind="id-card"
              label="College ID - back"
              hint="Keep text sharp and make sure the card fills the frame."
              capture="environment"
              error={errors.idBack?.message}
              validateSelection={(file) => ensureDistinctIdCard(file, idFrontFile)}
              onFile={(file) => setValue("idBack", file, { shouldValidate: true })}
            />
          </div>
        </div>

        <div className="mt-8 rounded-2xl bg-emerald-50 p-4 dark:bg-mint-300/[0.07]">
          <label className="flex cursor-pointer items-start gap-3 text-sm leading-6">
            <input type="checkbox" className="mt-1 size-4 accent-emerald-600" {...register("consent", { required: "Consent is required to continue" })} />
            <span>I confirm these details are accurate and consent to their use for event identity verification and attendance management.</span>
          </label>
          {fieldError("consent")}
        </div>
        <div className="mt-7 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck size={16} className="text-emerald-600 dark:text-mint-300" /> Documents are sent securely to the verification service.
          </p>
          <Button type="submit" loading={isSubmitting} disabled={events.length === 0}>
            Submit registration <ArrowRight size={17} />
          </Button>
        </div>
      </form>
    </section>
  );
};
