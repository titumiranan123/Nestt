"use client";

import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { deliveryApi } from "./api";

export const deliveryQueries = {
  areas: queryOptions({ queryKey: ["admin", "delivery", "areas"], queryFn: ({ signal }) => deliveryApi.listAreas(signal) }),
  managedAreas: queryOptions({
    queryKey: ["admin", "delivery", "managed-areas"],
    queryFn: ({ signal }) => deliveryApi.listManagedAreas(signal),
    meta: { silent: true },
  }),
  zones: queryOptions({
    queryKey: ["admin", "delivery", "zones"],
    queryFn: ({ signal }) => deliveryApi.listZones(signal),
    meta: { silent: true },
  }),
};

export function useDeliveryActions() {
  const client = useQueryClient();
  const refreshAreas = () => Promise.all([
    client.invalidateQueries({ queryKey: deliveryQueries.managedAreas.queryKey }),
    client.invalidateQueries({ queryKey: deliveryQueries.areas.queryKey }),
  ]);
  const saveLocation = useMutation({ mutationFn: deliveryApi.saveLocation, onSuccess: refreshAreas, meta: { silent: true, successMessage: "Location saved." } });
  const removeLocation = useMutation({ mutationFn: deliveryApi.removeLocation, onSuccess: refreshAreas, meta: { silent: true, successMessage: "Location deleted." } });
  const setDeliverability = useMutation({
    mutationFn: ({ id, isDeliverable }: { id: string; isDeliverable: boolean }) => deliveryApi.setDeliverability(id, isDeliverable),
    onSuccess: refreshAreas,
    meta: { silent: true, successMessage: "Deliverability updated." },
  });
  const bulkUpdate = useMutation({ mutationFn: deliveryApi.bulkUpdate, onSuccess: refreshAreas, meta: { successMessage: "Selected thanas updated." } });
  const saveZone = useMutation({
    mutationFn: deliveryApi.saveZone,
    onSuccess: () => client.invalidateQueries({ queryKey: deliveryQueries.zones.queryKey }),
    meta: { silent: true, successMessage: "Delivery zone saved." },
  });
  return { saveLocation, removeLocation, setDeliverability, bulkUpdate, saveZone };
}
