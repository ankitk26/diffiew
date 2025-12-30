/// <reference types="bun-types" />
import { describe, expect, it } from "bun:test";
import { computeDiff, enhanceWithCharDiffs } from "../src/lib/diff";

function simplify(lines: ReturnType<typeof computeDiff>): Array<{
	type: string;
	leftLine?: string;
	rightLine?: string;
	leftLineNumber?: number;
	rightLineNumber?: number;
}> {
	return lines.map((l) => ({
		type: l.type,
		leftLine: l.leftLine,
		rightLine: l.rightLine,
		leftLineNumber: l.leftLineNumber,
		rightLineNumber: l.rightLineNumber,
	}));
}

describe("computeDiff (line-level)", () => {
	it("produces all equal lines for identical input", () => {
		const left = "a\nb\nc";
		const right = "a\nb\nc";

		expect(simplify(computeDiff(left, right))).toEqual([
			{
				type: "equal",
				leftLine: "a",
				rightLine: "a",
				leftLineNumber: 1,
				rightLineNumber: 1,
			},
			{
				type: "equal",
				leftLine: "b",
				rightLine: "b",
				leftLineNumber: 2,
				rightLineNumber: 2,
			},
			{
				type: "equal",
				leftLine: "c",
				rightLine: "c",
				leftLineNumber: 3,
				rightLineNumber: 3,
			},
		]);
	});

	it("detects an insertion in the middle", () => {
		const left = "a\nc";
		const right = "a\nb\nc";

		expect(simplify(computeDiff(left, right))).toEqual([
			{
				type: "equal",
				leftLine: "a",
				rightLine: "a",
				leftLineNumber: 1,
				rightLineNumber: 1,
			},
			{ type: "insert", rightLine: "b", rightLineNumber: 2 },
			{
				type: "equal",
				leftLine: "c",
				rightLine: "c",
				leftLineNumber: 2,
				rightLineNumber: 3,
			},
		]);
	});

	it("detects a deletion in the middle", () => {
		const left = "a\nb\nc";
		const right = "a\nc";

		expect(simplify(computeDiff(left, right))).toEqual([
			{
				type: "equal",
				leftLine: "a",
				rightLine: "a",
				leftLineNumber: 1,
				rightLineNumber: 1,
			},
			{ type: "delete", leftLine: "b", leftLineNumber: 2 },
			{
				type: "equal",
				leftLine: "c",
				rightLine: "c",
				leftLineNumber: 3,
				rightLineNumber: 2,
			},
		]);
	});

	it("treats a changed line as modify when surrounding context matches", () => {
		const left = "a\nb\nc";
		const right = "a\nB\nc";

		expect(simplify(computeDiff(left, right))).toEqual([
			{
				type: "equal",
				leftLine: "a",
				rightLine: "a",
				leftLineNumber: 1,
				rightLineNumber: 1,
			},
			{
				type: "modify",
				leftLine: "b",
				rightLine: "B",
				leftLineNumber: 2,
				rightLineNumber: 2,
			},
			{
				type: "equal",
				leftLine: "c",
				rightLine: "c",
				leftLineNumber: 3,
				rightLineNumber: 3,
			},
		]);
	});

	it("handles repeated lines without turning everything into modify", () => {
		const left = "a\nx\na\ny";
		const right = "a\na\nx\ny";

		const diff = computeDiff(left, right);
		expect(diff.map((d) => d.type)).toEqual([
			"equal",
			"insert",
			"equal",
			"delete",
			"equal",
		]);
	});

	it("treats empty left as pure insertions (no bogus modify)", () => {
		const left = "";
		const right = "a\nb";

		expect(simplify(computeDiff(left, right))).toEqual([
			{ type: "insert", rightLine: "a", rightLineNumber: 1 },
			{ type: "insert", rightLine: "b", rightLineNumber: 2 },
		]);
	});

	it("treats empty right as pure deletions (no bogus modify)", () => {
		const left = "a\nb";
		const right = "";

		expect(simplify(computeDiff(left, right))).toEqual([
			{ type: "delete", leftLine: "a", leftLineNumber: 1 },
			{ type: "delete", leftLine: "b", leftLineNumber: 2 },
		]);
	});

	it("normalizes CRLF vs LF so '\\r' doesn't create fake diffs", () => {
		const left = "a\r\nb\r\nc\r\n";
		const right = "a\nb\nc\n";

		// Note: both inputs end with a trailing newline, so an empty last line is expected to match.
		expect(simplify(computeDiff(left, right))).toEqual([
			{
				type: "equal",
				leftLine: "a",
				rightLine: "a",
				leftLineNumber: 1,
				rightLineNumber: 1,
			},
			{
				type: "equal",
				leftLine: "b",
				rightLine: "b",
				leftLineNumber: 2,
				rightLineNumber: 2,
			},
			{
				type: "equal",
				leftLine: "c",
				rightLine: "c",
				leftLineNumber: 3,
				rightLineNumber: 3,
			},
			{
				type: "equal",
				leftLine: "",
				rightLine: "",
				leftLineNumber: 4,
				rightLineNumber: 4,
			},
		]);
	});

	it("represents trailing newline as an extra empty line", () => {
		const left = "a\n";
		const right = "a";

		expect(simplify(computeDiff(left, right))).toEqual([
			{
				type: "equal",
				leftLine: "a",
				rightLine: "a",
				leftLineNumber: 1,
				rightLineNumber: 1,
			},
			{ type: "delete", leftLine: "", leftLineNumber: 2 },
		]);
	});
});

describe("enhanceWithCharDiffs (token/char-level)", () => {
	it("adds char diffs for modify lines", () => {
		const left = "hello world";
		const right = "hello brave world";

		const diff = enhanceWithCharDiffs(computeDiff(left, right));
		const modify = diff.find((l) => l.type === "modify");
		expect(modify).toBeDefined();
		expect(modify?.leftCharDiffs).toBeDefined();
		expect(modify?.rightCharDiffs).toBeDefined();

		// Pure insertions may only show highlights on the right side; the left can remain all "equal".
		expect(modify?.rightCharDiffs?.some((c) => c.type !== "equal")).toBe(
			true,
		);

		// Char-diffs should reconstruct the original line content per side.
		const leftReconstructed = (modify?.leftCharDiffs ?? [])
			.map((c) => c.text)
			.join("");
		const rightReconstructed = (modify?.rightCharDiffs ?? [])
			.map((c) => c.text)
			.join("");
		expect(leftReconstructed).toBe(left);
		expect(rightReconstructed).toBe(right);
		expect(modify?.rightCharDiffs?.some((c) => c.type !== "equal")).toBe(
			true,
		);
	});

	it("highlights whitespace-only changes (space insert/delete)", () => {
		const left = "const x=1;";
		const right = "const x = 1;";

		const diff = enhanceWithCharDiffs(computeDiff(left, right));
		const modify = diff.find((l) => l.type === "modify");
		expect(modify).toBeDefined();
		expect(modify?.rightCharDiffs?.some((c) => c.type === "insert")).toBe(
			true,
		);
	});

	it("does not crash on large moved blocks (heuristic limitation accepted)", () => {
		const blockA = Array.from({ length: 30 }, (_, i) => `A${i}`).join("\n");
		const blockB = Array.from({ length: 30 }, (_, i) => `B${i}`).join("\n");
		const left = `${blockA}\n${blockB}`;
		const right = `${blockB}\n${blockA}`;

		const diff = computeDiff(left, right);
		// Invariant: output lines must account for all left+right line consumption.
		const consumedLeft = diff.filter((l) => l.leftLineNumber).length;
		const consumedRight = diff.filter((l) => l.rightLineNumber).length;
		expect(consumedLeft).toBe(left.split("\n").length);
		expect(consumedRight).toBe(right.split("\n").length);
	});
});
