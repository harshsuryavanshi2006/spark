import { divisions, batches, years } from '@/lib/student-rules';
export const fieldClass = 'w-full h-12 rounded-xl border bg-card px-4 text-sm outline-none focus:ring-2 focus:ring-ring';
export function StudentFields({ defaults = {} }: { defaults?: Record<string, string | null> }) {
 return <div className="grid gap-5">
 <label className="grid gap-2 text-sm font-medium">Full Name *<input name="full_name" required maxLength={100} defaultValue={defaults['full_name'] ?? ''} placeholder="Enter your full name" className={fieldClass} /></label>
 {([{ name: 'division', title: 'Division', values: divisions },{ name: 'batch', title: 'Batch', values: batches },{ name: 'year', title: 'Year', values: years }] as const).map(f => <label key={f.name} className="grid gap-2 text-sm font-medium">{f.title} *<select name={f.name} required defaultValue={defaults[f.name] ?? ''} className={fieldClass}><option value="">Select your {f.title.toLowerCase()}</option>{f.values.map(v => <option key={v} value={v}>{v}</option>)}</select></label>)}
 <label className="grid gap-2 text-sm font-medium">Date of Birth *<input name="date_of_birth" type="date" required defaultValue={defaults['date_of_birth'] ?? ''} className={fieldClass} /></label>
 <label className="grid gap-2 text-sm font-medium">College *<input name="college" required maxLength={150} defaultValue={defaults['college'] ?? ''} placeholder="Enter your college name" className={fieldClass} /></label>
 <label className="grid gap-2 text-sm font-medium">Phone Number *<input name="phone" type="tel" required maxLength={20} defaultValue={defaults['phone'] ?? ''} placeholder="+91 98765 43210" className={fieldClass} /></label>
 </div>;
}
