"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { getErrorMessage } from "@/lib/api/errors";
import { can } from "@/lib/rbac/can";
import type { DeliveryLocationInput, DeliveryZone, DeliveryZoneConfig } from "./api";
import { deliveryQueries, useDeliveryActions } from "./hooks";
import type { DeliveryDrawerContent, EntityEditor, EntityFormState, Thana, ZoneFormState } from "./types";

const fallbackZones: DeliveryZoneConfig[] = [
  { zone: "INSIDE_DHAKA", flatFee: "60", isFree: false, minOrderFree: null, estimatedDaysMin: null, estimatedDaysMax: null, isActive: true },
  { zone: "OUTSIDE_DHAKA", flatFee: "120", isFree: false, minOrderFree: null, estimatedDaysMin: null, estimatedDaysMax: null, isActive: true },
];

const emptyEntityForm: EntityFormState = {
  name: "", divisionId: "", districtId: "", deliveryZone: "OUTSIDE_DHAKA", shippingFee: "", freeDeliveryAbove: "", isDeliverable: true,
};

const emptyZoneForm: ZoneFormState = {
  flatFee: "", minOrderFree: "", estimatedDaysMin: "", estimatedDaysMax: "", isFree: false, isActive: true,
};

const amount = (value: string) => value.trim() ? String(Number(value)) : null;
const days = (value: string) => value.trim() ? Number(value) : null;

const deletionMessages = {
  division: "This division and all nested districts and thanas will be removed permanently.",
  district: "This district and all of its thanas will be removed permanently.",
  thana: "This thana will be removed permanently.",
};

export function useDeliveryManagement() {
  const { data: session } = useSession();
  const canEdit = can("orders:update", session?.user?.permissions);
  const areasQuery = useQuery(deliveryQueries.managedAreas);
  const zonesQuery = useQuery(deliveryQueries.zones);
  const actions = useDeliveryActions();
  const [divisionId, setDivisionId] = useState("");
  const [districtId, setSelectedDistrictId] = useState("");
  const [search, setSearch] = useState("");
  const [zoneFilter, setZoneFilter] = useState("");
  const [deliverableFilter, setDeliverableFilter] = useState("");
  const [selectedThanas, setSelectedThanas] = useState<Set<string>>(new Set());
  const [bulkZone, setBulkZone] = useState("");
  const [bulkDeliverable, setBulkDeliverable] = useState("");
  const [drawer, setDrawer] = useState<DeliveryDrawerContent | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [entityForm, setEntityForm] = useState<EntityFormState>(emptyEntityForm);
  const [zoneForm, setZoneForm] = useState<ZoneFormState>(emptyZoneForm);
  const [formError, setFormError] = useState("");

  const { divisions, allDistricts, allThanas } = useMemo(() => {
    const areas = areasQuery.data ?? [];
    return {
      divisions: areas.map(({ id, name, districts }) => ({ id, name, districtCount: districts.length })),
      allDistricts: areas.flatMap(({ districts }) => districts.map(({ id, name, divisionId, thanas }) => ({ id, name, divisionId, thanaCount: thanas.length }))),
      allThanas: areas.flatMap(({ id, name, districts }) => districts.flatMap((district) => district.thanas.map((thana) => ({
        ...thana,
        district: { name: district.name, division: { id, name } },
      })))),
    };
  }, [areasQuery.data]);
  const activeDivision = divisions.find(({ id }) => id === divisionId) ?? divisions[0];
  const selectedDivisionId = activeDivision?.id ?? "";
  const districts = allDistricts.filter((district) => district.divisionId === selectedDivisionId);
  const activeDistrict = districts.find(({ id }) => id === districtId);
  const selectedDistrictId = activeDistrict?.id ?? "";
  const searchTerm = search.trim().toLowerCase();
  const thanas = allThanas.filter((thana) => (
    (!selectedDistrictId || thana.districtId === selectedDistrictId) &&
    (!zoneFilter || thana.deliveryZone === zoneFilter) &&
    (!deliverableFilter || String(thana.isDeliverable) === deliverableFilter) &&
    thana.name.toLowerCase().includes(searchTerm)
  ));
  const visibleSelections = new Set(thanas.filter(({ id }) => selectedThanas.has(id)).map(({ id }) => id));
  const zoneConfigs = zonesQuery.data;
  const zones = zoneConfigs
    ? fallbackZones.map((fallback) => zoneConfigs.find(({ zone }) => zone === fallback.zone) ?? fallback)
    : [];

  const clearSelectedThanas = () => setSelectedThanas(new Set());
  const busy = actions.saveLocation.isPending || actions.saveZone.isPending || actions.removeLocation.isPending || actions.setDeliverability.isPending || actions.bulkUpdate.isPending;
  const canMutate = canEdit && !busy;
  const refreshAll = () => {
    void areasQuery.refetch();
    void zonesQuery.refetch();
  };

  function openDrawer(content: DeliveryDrawerContent) {
    setFormError("");
    setDrawer(content);
    setDrawerOpen(true);
  }

  function openEntityDrawer(next: EntityEditor) {
    if (!canMutate || drawerOpen) return;
    setEntityForm({
      ...emptyEntityForm,
      name: next.data?.name ?? "",
      divisionId: (next.type === "district" ? next.data?.divisionId : undefined) ?? selectedDivisionId,
      districtId: (next.type === "thana" ? next.data?.districtId : undefined) ?? selectedDistrictId,
      ...(next.type === "thana" && next.data ? {
        deliveryZone: next.data.deliveryZone,
        shippingFee: next.data.shippingFee ?? "",
        freeDeliveryAbove: next.data.freeDeliveryAbove ?? "",
        isDeliverable: next.data.isDeliverable,
      } : {}),
    });
    openDrawer(next);
  }

  function openZoneDrawer(zone: DeliveryZoneConfig) {
    if (!canMutate || drawerOpen) return;
    setZoneForm({
      flatFee: zone.flatFee,
      minOrderFree: zone.minOrderFree ?? "",
      estimatedDaysMin: zone.estimatedDaysMin?.toString() ?? "",
      estimatedDaysMax: zone.estimatedDaysMax?.toString() ?? "",
      isFree: zone.isFree,
      isActive: zone.isActive,
    });
    openDrawer({ type: "zone", data: zone });
  }

  function saveEntity() {
    if (!canMutate || !drawerOpen || !drawer || drawer.type === "zone" || drawer.type === "confirm") return;
    const id = drawer.data?.id;
    const name = entityForm.name.trim();
    let input: DeliveryLocationInput;
    if (drawer.type === "division") {
      input = { type: "division", id, data: { name } };
    } else if (drawer.type === "district") {
      input = { type: "district", id, data: { name, divisionId: entityForm.divisionId } };
    } else {
      input = {
        type: "thana",
        id,
        data: {
          name,
          districtId: entityForm.districtId,
          deliveryZone: entityForm.deliveryZone,
          shippingFee: amount(entityForm.shippingFee),
          freeDeliveryAbove: amount(entityForm.freeDeliveryAbove),
          isDeliverable: entityForm.isDeliverable,
        },
      };
    }
    setFormError("");
    actions.saveLocation.mutate(input, {
      onSuccess: () => {
        if (input.type === "district" && id === selectedDistrictId && input.data.divisionId !== selectedDivisionId) {
          setDivisionId(input.data.divisionId);
        }
        clearSelectedThanas();
        setDrawerOpen(false);
      },
      onError: (error) => setFormError(getErrorMessage(error)),
    });
  }

  function saveZone() {
    if (!canMutate || !drawerOpen || drawer?.type !== "zone") return;
    const estimatedDaysMin = days(zoneForm.estimatedDaysMin);
    const estimatedDaysMax = days(zoneForm.estimatedDaysMax);
    if (estimatedDaysMin !== null && estimatedDaysMax !== null && estimatedDaysMin > estimatedDaysMax) {
      setFormError("Maximum ETA must be at least the minimum ETA.");
      return;
    }
    setFormError("");
    actions.saveZone.mutate({
      zone: drawer.data.zone,
      flatFee: amount(zoneForm.flatFee) ?? "0",
      minOrderFree: amount(zoneForm.minOrderFree),
      estimatedDaysMin,
      estimatedDaysMax,
      isFree: zoneForm.isFree,
      isActive: zoneForm.isActive,
    }, {
      onSuccess: () => setDrawerOpen(false),
      onError: (error) => setFormError(getErrorMessage(error)),
    });
  }

  function openDeleteDrawer(entity: EntityEditor["type"], location: { id: string; name: string }) {
    if (!canMutate || drawerOpen) return;
    openDrawer({
      type: "confirm",
      title: `Delete ${location.name}?`,
      description: deletionMessages[entity],
      label: `Delete ${entity}`,
      action: { type: "delete", entity, id: location.id },
    });
  }

  function openDeliverabilityDrawer(thana: Thana) {
    if (!canMutate || drawerOpen) return;
    const isDeliverable = !thana.isDeliverable;
    openDrawer({
      type: "confirm",
      title: `${isDeliverable ? "Enable delivery to" : "Block delivery to"} ${thana.name}?`,
      description: isDeliverable ? "Customers can place orders for this area." : "Customers will be unable to place orders for this area.",
      label: isDeliverable ? "Enable delivery" : "Block delivery",
      action: { type: "deliverability", id: thana.id, isDeliverable },
    });
  }

  function confirmDrawerAction() {
    if (!canMutate || !drawerOpen || drawer?.type !== "confirm") return;
    setFormError("");
    const action = drawer.action;
    const onError = (error: unknown) => setFormError(getErrorMessage(error));
    if (action.type === "deliverability") {
      actions.setDeliverability.mutate({ id: action.id, isDeliverable: action.isDeliverable }, {
        onSuccess: () => setDrawerOpen(false),
        onError,
      });
      return;
    }

    const { entity, id } = action;
    actions.removeLocation.mutate({ type: entity, id }, {
      onSuccess: () => {
        if (entity === "division" && id === selectedDivisionId) {
          setDivisionId("");
          setSelectedDistrictId("");
        }
        if (entity === "district" && id === selectedDistrictId) setSelectedDistrictId("");
        clearSelectedThanas();
        setDrawerOpen(false);
      },
      onError,
    });
  }

  function applyBulkUpdate() {
    if (!canMutate || drawerOpen || !visibleSelections.size || (!bulkZone && !bulkDeliverable)) return;
    actions.bulkUpdate.mutate({
      thanaIds: [...visibleSelections],
      deliveryZone: (bulkZone || undefined) as DeliveryZone | undefined,
      isDeliverable: bulkDeliverable ? bulkDeliverable === "true" : undefined,
    }, {
      onSuccess: () => {
        clearSelectedThanas();
        setBulkZone("");
        setBulkDeliverable("");
      },
    });
  }

  function toggleThanaSelection(id: string) {
    setSelectedThanas((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return {
    activeDistrict, activeDivision, allDistricts,
    allVisibleSelected: thanas.length > 0 && visibleSelections.size === thanas.length,
    applyBulkUpdate, areasQuery, blockedCount: thanas.filter(({ isDeliverable }) => !isDeliverable).length,
    bulkDeliverable, bulkZone, canEdit, busy, clearSelectedThanas,
    closeDrawer: () => { if (!busy) setDrawerOpen(false); },
    confirmDrawerAction, deliverableFilter, districts, divisions, drawer, drawerOpen, entityForm, formError,
    openDeleteDrawer, openDeliverabilityDrawer, openEntityDrawer, openZoneDrawer, refreshAll, saveEntity, saveZone, search,
    selectedDistrictId, selectedDivisionId, selectedThanas: visibleSelections,
    setBulkDeliverable, setBulkZone, setDeliverableFilter, setEntityForm, setSearch,
    setSelectedDistrictId, setSelectedDivisionId: setDivisionId, setSelectedThanas, setZoneFilter,
    thanas, toggleThanaSelection, zoneFilter, zones, zonesQuery, zoneForm, setZoneForm,
  };
}
