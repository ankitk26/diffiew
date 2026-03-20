import { Textarea } from "./ui/textarea";

export default function EditView({
	oldCode,
	setOldCode,
	newCode,
	setNewCode,
}: {
	oldCode: string;
	setOldCode: (v: string) => void;
	newCode: string;
	setNewCode: (v: string) => void;
}) {
	return (
		<div className="grid flex-1 grid-cols-2 gap-4">
			<div className="flex flex-col gap-2">
				<label className="text-xs font-medium text-muted-foreground">
					Original code
				</label>
				<Textarea
					className="flex-1 font-mono"
					placeholder="Paste your original code here..."
					value={oldCode}
					onChange={(e) => setOldCode(e.target.value)}
				/>
			</div>
			<div className="flex flex-col gap-2">
				<label className="text-xs font-medium text-muted-foreground">
					Modified code
				</label>
				<Textarea
					className="flex-1 font-mono"
					placeholder="Paste your modified code here..."
					value={newCode}
					onChange={(e) => setNewCode(e.target.value)}
				/>
			</div>
		</div>
	);
}
