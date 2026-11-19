"use client";

import { Plus } from "lucide-react";
import { EmptyText, HierarchyButton, IconButton, PanelHeader, SmallLoading, Surface } from "./DeliveryPrimitives";
import type { District, Division } from "@/features/delivery/types";

type DeliveryHierarchyProps = {
  divisions: Division[];
  districts: District[];
  activeDivisionId: string;
  canEdit: boolean;
  selectedDistrictId: string;
  isDivisionsLoading: boolean;
  isDistrictsLoading: boolean;
  onAddDivision: () => void;
  onAddDistrict: () => void;
  onDivisionSelect: (divisionId: string) => void;
  onDistrictSelect: (districtId: string) => void;
  onEditDivision: (division: Division) => void;
  onEditDistrict: (district: District) => void;
  onDeleteDivision: (division: Division) => void;
  onDeleteDistrict: (district: District) => void;
};

export default function DeliveryHierarchy({
  divisions,
  districts,
  activeDivisionId,
  canEdit,
  selectedDistrictId,
  isDivisionsLoading,
  isDistrictsLoading,
  onAddDivision,
  onAddDistrict,
  onDivisionSelect,
  onDistrictSelect,
  onEditDivision,
  onEditDistrict,
  onDeleteDivision,
  onDeleteDistrict,
}: DeliveryHierarchyProps) {
  const activeDivision = divisions.find(
    (division) => division.id === activeDivisionId,
  );

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Surface className="flex h-142.5 min-h-0 flex-col overflow-hidden">
        <PanelHeader
          title="Divisions"
          description="Select division"
          action={
            <IconButton disabled={!canEdit} label="Add division" onClick={onAddDivision}>
              <Plus size={15} />
            </IconButton>
          }
        />
        <div className="min-h-0 flex-1 overflow-auto p-2">
          {isDivisionsLoading ? (
            <SmallLoading />
          ) : divisions.length ? (
            divisions.map((division) => (
              <HierarchyButton
                key={division.id}
                active={activeDivisionId === division.id}
                canEdit={canEdit}
                count={division.districtCount ?? 0}
                label={division.name}
                meta="districts"
                onClick={() => onDivisionSelect(division.id)}
                onEdit={() => onEditDivision(division)}
                onDelete={() => onDeleteDivision(division)}
              />
            ))
          ) : <EmptyText text="No divisions found." />}
        </div>
      </Surface>

      <Surface className="flex h-142.5 min-h-0 flex-col overflow-hidden">
        <PanelHeader
          title={activeDivision ? `${activeDivision.name} Districts` : "Districts"}
          description="Select district"
          action={
            <IconButton
              disabled={!canEdit || !activeDivisionId}
              label="Add district"
              onClick={onAddDistrict}
            >
              <Plus size={15} />
            </IconButton>
          }
        />
        <div className="min-h-0 flex-1 overflow-auto p-2">
          {isDistrictsLoading ? (
            <SmallLoading />
          ) : districts.length ? (
            districts.map((district) => (
              <HierarchyButton
                key={district.id}
                active={selectedDistrictId === district.id}
                canEdit={canEdit}
                count={district.thanaCount ?? 0}
                label={district.name}
                meta="thanas"
                onClick={() => onDistrictSelect(district.id)}
                onEdit={() => onEditDistrict(district)}
                onDelete={() => onDeleteDistrict(district)}
              />
            ))
          ) : (
            <EmptyText text={activeDivision ? "No districts found." : "Select a division first."} />
          )}
        </div>
      </Surface>
    </div>
  );
}
