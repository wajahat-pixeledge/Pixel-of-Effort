import { createAccessRuleAction } from "@/app/_actions/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export function AllowlistForm() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Add access rule</CardTitle>
        <CardDescription>
          Use `domain`, `email`, or SQL-style `pattern` matching.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={createAccessRuleAction} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="ruleType">Rule type</Label>
            <Select id="ruleType" name="ruleType" defaultValue="domain" required>
              <option value="domain">Domain</option>
              <option value="email">Email</option>
              <option value="pattern">Pattern</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="accessValue">Rule value</Label>
            <Input id="accessValue" name="accessValue" placeholder="company.com or %@company.com" required />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="note">Note (optional)</Label>
            <Input id="note" name="note" placeholder="Main company policy" />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit">Save rule</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
