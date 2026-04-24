"use client";

import { useState } from "react";

import { createTimeEntryAction } from "@/app/_actions/time-entries";
import { TIME_ENTRY_CATEGORY_OPTIONS, TIME_ENTRY_STATUS_OPTIONS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface TimeEntryFormProps {
  assignedProjects: Array<{
    id: string;
    name: string;
  }>;
}

export function TimeEntryForm({ assignedProjects }: TimeEntryFormProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [clientError, setClientError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    const category = String(formData.get("category") ?? "");
    const projectId = String(formData.get("projectId") ?? "");
    const hoursValue = Number(formData.get("hours"));

    if (!Number.isFinite(hoursValue) || hoursValue <= 0 || hoursValue > 24) {
      event.preventDefault();
      setClientError("Hours must be greater than 0 and up to 24.");
      return;
    }

    if (category === "project" && !projectId) {
      event.preventDefault();
      setClientError("Please select a project for Project category.");
      return;
    }

    if (category !== "project" && projectId) {
      event.preventDefault();
      setClientError("Project must be empty for non-project categories.");
      return;
    }

    setClientError(null);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log time</CardTitle>
        <CardDescription>
          Enter hours, select category, and optionally add context with status/comment.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={createTimeEntryAction} onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="workDate">Date</Label>
            <Input id="workDate" name="workDate" type="date" defaultValue={today} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hours">Hours</Label>
            <Input
              id="hours"
              name="hours"
              type="number"
              min={0.25}
              max={24}
              step={0.25}
              placeholder="e.g. 2.5"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select id="category" name="category" defaultValue="project" required>
              {TIME_ENTRY_CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="projectId">Project</Label>
            <Select id="projectId" name="projectId" defaultValue="">
              <option value="">No project</option>
              {assignedProjects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="statusFlag">Status flag</Label>
            <Select id="statusFlag" name="statusFlag" defaultValue="none">
              {TIME_ENTRY_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="comment">Comment (optional)</Label>
            <Textarea id="comment" name="comment" placeholder="Add context if needed..." />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit">Save time entry</Button>
          </div>
          {clientError ? (
            <p className="sm:col-span-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {clientError}
            </p>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
