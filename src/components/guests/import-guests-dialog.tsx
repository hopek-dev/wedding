"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { bulkCreateGuests, type ImportMode } from "@/app/actions/guests";
import { parseGuestRows, type ImportedGuest } from "@/lib/guest-import";
import { FileSpreadsheet } from "lucide-react";

const PREVIEW_LIMIT = 25;

export function ImportGuestsDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [guests, setGuests] = useState<ImportedGuest[]>([]);
  const [skipped, setSkipped] = useState(0);
  const [fileName, setFileName] = useState("");
  const [mode, setMode] = useState<ImportMode>("skip");
  const [confirmReplace, setConfirmReplace] = useState(false);

  function reset() {
    setGuests([]);
    setSkipped(0);
    setFileName("");
    setConfirmReplace(false);
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setParsing(true);
    reset();
    setFileName(file.name);
    try {
      const XLSX = await import("xlsx");
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
      const result = parseGuestRows(rows);
      if (!result.matchedName) {
        toast.error("Couldn't find a name column. Expected a header like \"First Name\" or \"Full Name\".");
        reset();
        return;
      }
      setGuests(result.guests);
      setSkipped(result.skipped);
      if (result.guests.length === 0) {
        toast.error("No guest rows found in that file.");
      }
    } catch {
      toast.error("Couldn't read that file. Make sure it's a valid .xlsx, .xls, or .csv file.");
      reset();
    } finally {
      setParsing(false);
      e.target.value = "";
    }
  }

  async function handleImport() {
    setImporting(true);
    try {
      const result = await bulkCreateGuests(guests, mode);
      if (!result.ok) {
        toast.error(`Import failed: ${result.error}`);
        return;
      }
      const { inserted, updated, duplicates, linked, removed } = result;
      toast.success(
        `Imported ${inserted} guest${inserted === 1 ? "" : "s"}` +
          (updated ? ` · ${updated} updated` : "") +
          (removed ? ` · ${removed} old guest${removed === 1 ? "" : "s"} removed` : "") +
          (linked ? ` · ${linked} plus-one${linked === 1 ? "" : "s"} linked` : "") +
          (duplicates ? ` · ${duplicates} skipped` : "")
      );
      setOpen(false);
      reset();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <FileSpreadsheet className="size-4" />
        Import from Excel
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import guests from a spreadsheet</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <p className="text-sm text-muted-foreground">
            Upload an .xlsx, .xls, or .csv file. Recognized columns: <strong>First Name</strong> +{" "}
            <strong>Last Name</strong> (or a single <strong>Full Name</strong> column), Email, Phone, Notes.
            Column order doesn&apos;t matter and names are matched flexibly. Plus-one links aren&apos;t
            imported — connect those afterward by editing a guest.
          </p>
          <fieldset className="grid gap-2 rounded-md border p-3 text-sm">
            <legend className="px-1 text-xs font-medium text-muted-foreground">If a guest is already on the list</legend>
            <label className="flex items-start gap-2">
              <input type="radio" name="import-mode" className="mt-1" checked={mode === "skip"} onChange={() => { setMode("skip"); setConfirmReplace(false); }} />
              <span>
                <strong>Skip them</strong>
                <span className="block text-muted-foreground">Keep what&apos;s there and only add new guests.</span>
              </span>
            </label>
            <label className="flex items-start gap-2">
              <input type="radio" name="import-mode" className="mt-1" checked={mode === "override"} onChange={() => { setMode("override"); setConfirmReplace(false); }} />
              <span>
                <strong>Override them</strong>
                <span className="block text-muted-foreground">
                  Update their details from the sheet. Blank cells never erase existing data, and RSVPs and seating are untouched.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-2">
              <input type="radio" name="import-mode" className="mt-1" checked={mode === "replace"} onChange={() => setMode("replace")} />
              <span>
                <strong className="text-destructive">Replace the entire list</strong>
                <span className="block text-muted-foreground">
                  Delete every current guest and import only this sheet.
                </span>
              </span>
            </label>
            {mode === "replace" && (
              <label className="flex items-start gap-2 rounded-md bg-destructive/10 p-2 text-destructive">
                <input type="checkbox" className="mt-1" checked={confirmReplace} onChange={(e) => setConfirmReplace(e.target.checked)} />
                <span>
                  I understand this permanently deletes all current guests, along with their RSVP responses and seating.
                </span>
              </label>
            )}
          </fieldset>
          <Input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} disabled={parsing} />
          {parsing && <p className="text-sm text-muted-foreground">Reading {fileName}...</p>}
          {!parsing && guests.length > 0 && (
            <div className="grid gap-2">
              <div className="text-sm font-medium">
                {guests.length} guest{guests.length === 1 ? "" : "s"} ready to import
                {skipped > 0 ? ` · ${skipped} row${skipped === 1 ? "" : "s"} skipped (no name)` : ""}
              </div>
              <div className="max-h-64 overflow-y-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Tag</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Plus-one</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {guests.slice(0, PREVIEW_LIMIT).map((guest, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          {[guest.title, guest.first_name, guest.last_name].filter(Boolean).join(" ")}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{guest.tag}</TableCell>
                        <TableCell className="text-muted-foreground">{guest.email || guest.phone}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {guest.plus_one_of_name
                            ? `of ${guest.plus_one_of_name}`
                            : guest.plus_one_names?.join(", ") ||
                              (guest.plus_ones_allowed ? `${guest.plus_ones_allowed} allowed` : "")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {guests.length > PREVIEW_LIMIT && (
                <p className="text-xs text-muted-foreground">
                  Showing the first {PREVIEW_LIMIT} of {guests.length} rows.
                </p>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleImport} disabled={guests.length === 0 || importing || (mode === "replace" && !confirmReplace)}>
            {importing
              ? "Importing..."
              : mode === "replace"
                ? `Replace list with ${guests.length || ""} guest${guests.length === 1 ? "" : "s"}`
                : `Import ${guests.length || ""} guest${guests.length === 1 ? "" : "s"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
