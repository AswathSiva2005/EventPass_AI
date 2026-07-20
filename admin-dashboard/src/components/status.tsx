export const Status = ({value}:{value:string}) => {
  const good=["approved","checked_in","checked_out","published"].includes(value);
  const bad=["rejected","absent","cancelled"].includes(value);
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-extrabold tracking-wide uppercase ${good?"bg-emerald-100 text-emerald-700 dark:bg-emerald-400/12 dark:text-emerald-300":bad?"bg-rose-100 text-rose-700 dark:bg-rose-400/12 dark:text-rose-300":"bg-amber-100 text-amber-700 dark:bg-amber-400/12 dark:text-amber-300"}`}>{value.replaceAll("_"," ")}</span>;
};
