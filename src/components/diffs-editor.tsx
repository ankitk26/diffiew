import { useHotkey } from "@tanstack/react-hotkeys";
import { useSearch, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import DiffView from "./diff-view";
import EditView from "./edit-view";
import { Button } from "./ui/button";

export default function DiffsEditor() {
	const { view } = useSearch({ from: "/" });
	const navigate = useNavigate({ from: "/" });
	const [oldCode, setOldCode] = useState("");
	const [newCode, setNewCode] = useState("");

	const isDiff = view === "diff";
	const bothEmpty = !oldCode && !newCode;

	const toggle = () => {
		if (!isDiff && bothEmpty) return;
		navigate({ search: { view: isDiff ? "edit" : "diff" } });
	};

	useHotkey("Mod+Enter", toggle);

	return (
		<div className="h-svh w-svw p-6">
			<div className="flex h-full flex-col gap-4">
				{isDiff ? (
					<Button variant="outline" size="lg" onClick={toggle}>
						Back to editor
					</Button>
				) : (
					<Button size="lg" onClick={toggle} disabled={bothEmpty}>
						Compare
					</Button>
				)}
				{isDiff ? (
					<DiffView oldCode={oldCode} newCode={newCode} />
				) : (
					<EditView
						oldCode={oldCode}
						setOldCode={setOldCode}
						newCode={newCode}
						setNewCode={setNewCode}
					/>
				)}
			</div>
		</div>
	);
}
