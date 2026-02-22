// ✅ Made fully responsive (mobile → tablet → desktop) - Functionality untouched
"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  DeliveryNoteSettings,
  FinanceCompany,
  UpdateDeliveryNoteSettingsDto,
} from "@/lib/types";
import {
  getDeliveryNoteSettings,
  updateDeliveryNoteSettings,
} from "@/lib/api/delivery-note-settings";
import {
  createFinanceCompany,
  deleteFinanceCompany,
  getFinanceCompanies,
} from "@/lib/api/finance-companies";
import { getApiErrorMessage } from "@/lib/api/error-message";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormError } from "@/components/ui/form-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

const EMPTY_SETTINGS: DeliveryNoteSettings = {
  shopName: null,
  shopAddress: null,
  gstNumber: null,
  contactNumber: null,
  footerText: null,
  termsAndConditions: null,
  logoUrl: null,
  signatureLine: null,
};

function normalizePayload(values: DeliveryNoteSettings): UpdateDeliveryNoteSettingsDto {
  const normalize = (value: string | null) => {
    if (value == null) return null;
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  };

  return {
    shopName: normalize(values.shopName),
    shopAddress: normalize(values.shopAddress),
    gstNumber: normalize(values.gstNumber),
    contactNumber: normalize(values.contactNumber),
    footerText: normalize(values.footerText),
    termsAndConditions: normalize(values.termsAndConditions),
    logoUrl: normalize(values.logoUrl),
    signatureLine: normalize(values.signatureLine),
  };
}

export default function SettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsError, setSettingsError] = useState("");
  const [settings, setSettings] = useState<DeliveryNoteSettings>(EMPTY_SETTINGS);

  const [companies, setCompanies] = useState<FinanceCompany[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [addingCompany, setAddingCompany] = useState(false);
  const [deletingCompanyId, setDeletingCompanyId] = useState<number | null>(null);

  const loadSettings = useCallback(async () => {
    try {
      const response = await getDeliveryNoteSettings();
      setSettings(response);
    } catch (error: unknown) {
      setSettings(EMPTY_SETTINGS);
      setSettingsError(getApiErrorMessage(error, "Failed to load delivery note settings."));
    }
  }, []);

  const loadFinanceCompanies = useCallback(async () => {
    setLoadingCompanies(true);
    try {
      const rows = await getFinanceCompanies();
      setCompanies(rows);
    } catch {
      setCompanies([]);
    } finally {
      setLoadingCompanies(false);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([loadSettings(), loadFinanceCompanies()]);
      setLoading(false);
    };

    void load();
  }, [loadSettings, loadFinanceCompanies]);

  const updateField = (key: keyof DeliveryNoteSettings, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const saveDeliverySettings = async () => {
    setSavingSettings(true);
    setSettingsError("");
    try {
      const updated = await updateDeliveryNoteSettings(normalizePayload(settings));
      setSettings(updated);
      toast({
        title: "Settings saved",
        description: "Delivery note settings updated successfully.",
        variant: "success",
      });
    } catch (error: unknown) {
      setSettingsError(getApiErrorMessage(error, "Failed to update delivery note settings."));
    } finally {
      setSavingSettings(false);
    }
  };

  const addFinanceCompany = async () => {
    const name = newCompanyName.trim();

    if (!name) {
      return;
    }

    setAddingCompany(true);
    try {
      const created = await createFinanceCompany(name);
      setCompanies((prev) => {
        const next = [...prev, created];
        const seen = new Set<number>();
        return next.filter((row) => {
          if (seen.has(row.id)) return false;
          seen.add(row.id);
          return true;
        });
      });
      setNewCompanyName("");
      toast({
        title: "Finance company added",
        description: `${created.name} added successfully.`,
        variant: "success",
      });
    } catch (error: unknown) {
      toast({
        title: "Unable to add company",
        description: getApiErrorMessage(error, "Failed to create finance company."),
        variant: "error",
      });
    } finally {
      setAddingCompany(false);
    }
  };

  const removeFinanceCompany = async (company: FinanceCompany) => {
    setDeletingCompanyId(company.id);
    try {
      await deleteFinanceCompany(company.id);
      setCompanies((prev) => prev.filter((row) => row.id !== company.id));
      toast({
        title: "Finance company deleted",
        description: `${company.name} removed successfully.`,
        variant: "success",
      });
    } catch (error: unknown) {
      toast({
        title: "Unable to delete company",
        description: getApiErrorMessage(error, "Failed to delete finance company."),
        variant: "error",
      });
    } finally {
      setDeletingCompanyId(null);
    }
  };

  if (loading) {
    return (
<div className="space-y-4 sm:space-y-6">
      <Skeleton className="h-8 w-56" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      <div>
        <h2 className="srs-page-title">Settings</h2>
        <p className="srs-muted">Manage delivery note and finance company configuration.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-primary">Delivery Note Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 lg:space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-6">
            <div>
              <Label htmlFor="shopName">Shop Name</Label>
              <Input
                id="shopName"
                value={settings.shopName ?? ""}
                onChange={(event) => updateField("shopName", event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="contactNumber">Contact Number</Label>
              <Input
                id="contactNumber"
                value={settings.contactNumber ?? ""}
                onChange={(event) => updateField("contactNumber", event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="gstNumber">GST Number</Label>
              <Input
                id="gstNumber"
                value={settings.gstNumber ?? ""}
                onChange={(event) => updateField("gstNumber", event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="signatureLine">Signature Line</Label>
              <Input
                id="signatureLine"
                value={settings.signatureLine ?? ""}
                onChange={(event) => updateField("signatureLine", event.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="shopAddress">Shop Address</Label>
            <Textarea
              id="shopAddress"
              value={settings.shopAddress ?? ""}
              onChange={(event) => updateField("shopAddress", event.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="termsAndConditions">Terms and Conditions</Label>
            <Textarea
              id="termsAndConditions"
              value={settings.termsAndConditions ?? ""}
              onChange={(event) => updateField("termsAndConditions", event.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="footerText">Footer Text</Label>
            <Textarea
              id="footerText"
              value={settings.footerText ?? ""}
              onChange={(event) => updateField("footerText", event.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="logoUrl">Logo URL</Label>
            <Input
              id="logoUrl"
              value={settings.logoUrl ?? ""}
              onChange={(event) => updateField("logoUrl", event.target.value)}
            />
          </div>

          <FormError message={settingsError} />

          <Button
            type="button"
            onClick={() => {
              void saveDeliverySettings();
            }}
            disabled={savingSettings}
          >
            {savingSettings ? "Saving..." : "Save Settings"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-primary">Finance Companies</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              placeholder="Enter finance company name"
              value={newCompanyName}
              onChange={(event) => setNewCompanyName(event.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void addFinanceCompany();
              }}
              disabled={addingCompany || !newCompanyName.trim()}
            >
              {addingCompany ? "Adding..." : "Add Company"}
            </Button>
          </div>

          {loadingCompanies ? (
            <Skeleton className="h-28 w-full" />
          ) : companies.length ? (
            <div className="space-y-2">
              {companies.map((company) => (
                <div
                  key={company.id}
                  className="flex items-center justify-between rounded-lg border px-3 py-2"
                >
                  <p className="text-sm font-medium text-foreground">{company.name}</p>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={deletingCompanyId === company.id}
                    onClick={() => {
                      void removeFinanceCompany(company);
                    }}
                  >
                    {deletingCompanyId === company.id ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No finance companies found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
