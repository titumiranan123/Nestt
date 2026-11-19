"use client";

import { Layers3, Map, Plus, RefreshCw, ShieldOff, Truck } from "lucide-react";
import AdminDrawer from "@/components/admin/AdminDrawer";
import EntityEditorForm from "./delivery/EntityEditorForm";
import DeliveryHierarchy from "./delivery/DeliveryHierarchy";
import { Metric, Surface } from "./delivery/DeliveryPrimitives";
import DeliveryThanaSection from "./delivery/DeliveryThanaSection";
import DeliveryZoneCard from "./delivery/ZoneCard";
import ZoneEditorForm from "./delivery/ZoneEditorForm";
import { Button, DrawerFooter } from "./delivery/DeliveryForm";
import { useDeliveryManagement } from "@/features/delivery/useDeliveryManagement";
import { zoneLabels } from "@/features/delivery/types";
import { AdminRequestState } from "@/components/admin/AdminRequestState";
import "./delivery/delivery.css";

export default function DeliveryManagementPage() {
  const {
    activeDistrict,
    activeDivision,
    allDistricts,
    allVisibleSelected,
    applyBulkUpdate,
    areasQuery,
    blockedCount,
    bulkDeliverable,
    bulkZone,
    busy,
    canEdit,
    clearSelectedThanas,
    closeDrawer,
    confirmDrawerAction,
    deliverableFilter,
    districts,
    divisions,
    entityForm,
    formError,
    drawer,
    drawerOpen,
    openDeleteDrawer,
    openDeliverabilityDrawer,
    openEntityDrawer,
    openZoneDrawer,
    refreshAll,
    saveEntity,
    saveZone,
    search,
    selectedDistrictId,
    selectedDivisionId,
    selectedThanas,
    setBulkDeliverable,
    setBulkZone,
    setDeliverableFilter,
    setEntityForm,
    setSearch,
    setSelectedDistrictId,
    setSelectedDivisionId,
    setSelectedThanas,
    setZoneFilter,
    toggleThanaSelection,
    thanas,
    zoneFilter,
    zones,
    zonesQuery,
    zoneForm,
    setZoneForm,
  } = useDeliveryManagement();
  const canChange = canEdit && !busy && !drawerOpen;
  let drawerTitle = "";
  let drawerDescription = "";
  if (drawer?.type === "confirm") {
    drawerTitle = drawer.title;
    drawerDescription = drawer.description;
  } else if (drawer?.type === "zone") {
    drawerTitle = `Edit ${zoneLabels[drawer.data.zone]} delivery settings`;
    drawerDescription = "Set delivery fees, free delivery rules, and estimated delivery days.";
  } else if (drawer) {
    drawerTitle = `${drawer.mode === "edit" ? "Edit" : "Create"} ${drawer.type}`;
    drawerDescription = drawer.type === "thana" ? "Set the district, delivery zone, and fee overrides." : "Update the delivery location hierarchy.";
  }

  return (
    <div className="delivery-management space-y-4" inert={drawerOpen}>
      <header className="flex flex-col gap-3 rounded-2xl border border-(--border-default) bg-[rgba(255,255,255,0.96)] px-4 py-3 min-[30rem]:px-5 min-[30rem]:py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex w-full flex-col justify-between gap-3 lg:flex-row lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-secondary">
              Delivery Operations
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
              Delivery Zone Management
            </h1>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">
              Configure Bangladesh delivery areas, fees, and deliverability.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-(--border-default) bg-white px-4 text-sm font-semibold text-gray-700 transition hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface-muted)]"
              type="button"
              onClick={refreshAll}
            >
              <RefreshCw size={15} /> Refresh
            </button>
            <button
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-secondary px-4 text-sm font-semibold text-white transition hover:bg-secondary/90 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!canChange || !selectedDistrictId}
              type="button"
              onClick={() => openEntityDrawer({ type: "thana", mode: "create" })}
            >
              <Plus size={15} /> Add Thana
            </button>
          </div>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric
          icon={<Layers3 size={17} />}
          label="Divisions"
          value={divisions.length}
        />
        <Metric
          icon={<Map size={17} />}
          label="Districts"
          value={districts.length}
        />
        <Metric
          icon={<Truck size={17} />}
          label="Visible Thanas"
          value={thanas.length}
        />
        <Metric
          icon={<ShieldOff size={17} />}
          label="Blocked Areas"
          value={blockedCount}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {zonesQuery.isPending ? (
          <Surface className="p-6 text-center text-sm text-gray-500 xl:col-span-2">
            Loading delivery zone configs...
          </Surface>
        ) : zonesQuery.isError ? (
          <Surface className="space-y-3 p-6 text-center xl:col-span-2">
            <p className="text-sm text-red-600" role="alert">
              Failed to load delivery zone configurations.
            </p>
            <Button
              disabled={zonesQuery.isFetching}
              onClick={() => void zonesQuery.refetch()}
              type="button"
              variant="secondary"
            >
              Retry
            </Button>
          </Surface>
        ) : (
          zones.map((zone) => (
            <DeliveryZoneCard
              key={zone.zone}
              config={zone}
              canEdit={canChange}
              onEdit={() => openZoneDrawer(zone)}
            />
          ))
        )}
      </section>

      {areasQuery.isError && (
        <Surface className="p-6">
          <AdminRequestState request={areasQuery} label="delivery areas" />
        </Surface>
      )}
      {(!areasQuery.isError || areasQuery.data) && <section className="grid gap-4 xl:grid-cols-[minmax(0,540px)_minmax(0,1fr)]">
        <DeliveryHierarchy
          activeDivisionId={selectedDivisionId}
          canEdit={canChange}
          divisions={divisions}
          districts={districts}
          isDistrictsLoading={areasQuery.isPending}
          isDivisionsLoading={areasQuery.isPending}
          onAddDistrict={() =>
            openEntityDrawer({ type: "district", mode: "create" })
          }
          onAddDivision={() =>
            openEntityDrawer({ type: "division", mode: "create" })
          }
          onDistrictSelect={(districtId) => {
            setSelectedDistrictId(districtId);
            clearSelectedThanas();
          }}
          onDivisionSelect={(divisionId) => {
            setSelectedDivisionId(divisionId);
            setSelectedDistrictId("");
            clearSelectedThanas();
          }}
          onEditDistrict={(district) =>
            openEntityDrawer({ type: "district", mode: "edit", data: district })
          }
          onEditDivision={(division) =>
            openEntityDrawer({ type: "division", mode: "edit", data: division })
          }
          onDeleteDistrict={(district) => openDeleteDrawer("district", district)}
          onDeleteDivision={(division) => openDeleteDrawer("division", division)}
          selectedDistrictId={selectedDistrictId}
        />

        <DeliveryThanaSection
          activeDistrictName={activeDistrict?.name}
          activeDivisionName={activeDivision?.name}
          allVisibleSelected={allVisibleSelected}
          bulkDeliverable={bulkDeliverable}
          bulkZone={bulkZone}
          canEdit={canEdit}
          busy={busy || drawerOpen}
          deliverableFilter={deliverableFilter}
          onAddThana={() => openEntityDrawer({ type: "thana", mode: "create" })}
          onApplyBulkUpdate={applyBulkUpdate}
          onBulkDeliverableChange={setBulkDeliverable}
          onBulkZoneChange={setBulkZone}
          onDeliverableFilterChange={(value) => {
            setDeliverableFilter(value);
            clearSelectedThanas();
          }}
          onEditThana={(thana) =>
            openEntityDrawer({ type: "thana", mode: "edit", data: thana })
          }
          onDeleteThana={(thana) => openDeleteDrawer("thana", thana)}
          onSearchChange={(value) => {
            setSearch(value);
            clearSelectedThanas();
          }}
          onSelectAllToggle={() =>
            setSelectedThanas(
              allVisibleSelected
                ? new Set()
                : new Set(thanas.map((item) => item.id)),
            )
          }
          onToggleThanaDeliverable={openDeliverabilityDrawer}
          onToggleThanaSelection={toggleThanaSelection}
          onZoneFilterChange={(value) => {
            setZoneFilter(value);
            clearSelectedThanas();
          }}
          search={search}
          selectedDistrictId={selectedDistrictId}
          selectedThanas={selectedThanas}
          selectedThanasCount={selectedThanas.size}
          thanaCount={thanas.length}
          thanaLoading={areasQuery.isPending}
          thanas={thanas}
          zoneFilter={zoneFilter}
        />
      </section>}

      <AdminDrawer open={drawerOpen} title={drawerTitle} description={drawerDescription} onClose={closeDrawer}>
        {drawer?.type === "zone" && (
          <ZoneEditorForm
            error={formError}
            form={zoneForm}
            isSaving={busy}
            onChange={setZoneForm}
            onClose={closeDrawer}
            onSubmit={(event) => {
              event.preventDefault();
              saveZone();
            }}
          />
        )}
        {drawer?.type === "confirm" && (
          <div className="flex min-h-full flex-col justify-end" aria-busy={busy}>
            <DrawerFooter error={formError}>
              <Button type="button" variant="secondary" disabled={busy} onClick={closeDrawer}>Cancel</Button>
              <Button type="button" variant={drawer.action.type === "delete" ? "danger" : "primary"} disabled={busy} onClick={confirmDrawerAction}>
                {busy ? "Working…" : drawer.label}
              </Button>
            </DrawerFooter>
          </div>
        )}
        {drawer && drawer.type !== "zone" && drawer.type !== "confirm" && (
          <EntityEditorForm
            error={formError}
            editor={drawer}
            form={entityForm}
            divisions={divisions}
            districts={allDistricts}
            isSaving={busy}
            onChange={setEntityForm}
            onClose={closeDrawer}
            onSubmit={(event) => {
              event.preventDefault();
              saveEntity();
            }}
          />
        )}
      </AdminDrawer>
    </div>
  );
}
