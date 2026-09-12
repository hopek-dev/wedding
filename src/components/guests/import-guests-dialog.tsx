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
import { bulkCreateGuests } from "@/app/actions/guests";
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

  function reset() {
    setGuests([]);
    setSkipped(0);
    setFileName("");
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
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
      const result = parseGuestRows(rows);
      if (!result.matchedName) {
        toast.error("Couldn't find a name column. Expected a header like \"Full Name\" or \"Name\".");
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
      const { inserted } = await bulkCreateGuests(guests);
      toast.success(`Imported ${inserted} guest${inserted === 1 ? "" : "s"}`);
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
            Upload an .xlsx, .xls, or .csv file. Recognized columns: <strong>Full Name</strong> (required),
            Email, Phone, Side (Partner 1 / Partner 2 / Both), Plus One Allowed, Plus One Name, Notes. Column
            order doesn&apos;t matter and names are matched flexibly.
          </p>
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
                      <TableHead>Email</TableHead>
                      <TableHead>Side</TableHead>
                      <TableHead>Plus one</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {guests.slice(0, PREVIEW_LIMIT).map((guest, i) => (
                      <TableRow key={i}>
                        <TableCell>{guest.full_name}</TableCell>
                        <TableCell className="text-muted-foreground">{guest.email}</TableCell>
                        <TableCell className="text-muted-foreground">{guest.side}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {guest.plus_one_allowed ? guest.plus_one_name || "Yes" : ""}
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
          <Button onClick={handleImport} disabled={guests.length === 0 || importing}>
            {importing ? "Importing..." : `Import ${guests.length || ""} guest${guests.length === 1 ? "" : "s"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
