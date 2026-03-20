import type { FileContents } from "@pierre/diffs";
import { MultiFileDiff } from "@pierre/diffs/react";
import { useHotkey } from "@tanstack/react-hotkeys";
import { useSearch, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTheme } from "./theme-provider";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";

export default function DiffsEditor() {
	const { theme } = useTheme();
	const { view } = useSearch({ from: "/" });
	const navigate = useNavigate({ from: "/" });
	const [oldCode, setOldCode] = useState("");
	const [newCode, setNewCode] = useState("");

	const isDiff = view === "diff";

	const toggle = () =>
		navigate({ search: { view: isDiff ? "edit" : "diff" } });

	useHotkey("Mod+Enter", toggle);

	if (isDiff) {
		const oldFile: FileContents = { name: "", contents: oldCode };
		const newFile: FileContents = { name: "", contents: newCode };

		return (
			<div className="h-svh w-svw p-6">
				<div className="flex h-full flex-col gap-4">
					<Button variant="outline" size="lg" onClick={toggle}>
						Back to editor
					</Button>
					<div className="flex-1 overflow-auto">
						<MultiFileDiff
							oldFile={oldFile}
							newFile={newFile}
							options={{
								diffStyle: "split",
								themeType: theme,
								theme: {
									dark: "vitesse-dark",
									light: "vitesse-light",
								},
								unsafeCSS:
									"[data-no-newline], [data-gutter-buffer='metadata'], [data-change-icon] { display: none !important; } [data-diffs-header] [data-metadata] { order: -1; }",
							}}
						/>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="h-svh w-svw p-6">
			<div className="flex h-full flex-col gap-4">
				<Button size="lg" onClick={toggle}>
					Compare
				</Button>
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
			</div>
		</div>
	);
}
