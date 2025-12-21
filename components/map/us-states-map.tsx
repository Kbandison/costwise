"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import { getMapColorForCOL } from "@/lib/utils";
import { MapTooltip } from "./map-tooltip";

// State name to code mapping (since TopoJSON only has names)
const STATE_NAME_TO_CODE: Record<string, string> = {
  "Alabama": "AL", "Alaska": "AK", "Arizona": "AZ", "Arkansas": "AR",
  "California": "CA", "Colorado": "CO", "Connecticut": "CT", "Delaware": "DE",
  "District of Columbia": "DC", "Florida": "FL", "Georgia": "GA", "Hawaii": "HI",
  "Idaho": "ID", "Illinois": "IL", "Indiana": "IN", "Iowa": "IA",
  "Kansas": "KS", "Kentucky": "KY", "Louisiana": "LA", "Maine": "ME",
  "Maryland": "MD", "Massachusetts": "MA", "Michigan": "MI", "Minnesota": "MN",
  "Mississippi": "MS", "Missouri": "MO", "Montana": "MT", "Nebraska": "NE",
  "Nevada": "NV", "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM",
  "New York": "NY", "North Carolina": "NC", "North Dakota": "ND", "Ohio": "OH",
  "Oklahoma": "OK", "Oregon": "OR", "Pennsylvania": "PA", "Rhode Island": "RI",
  "South Carolina": "SC", "South Dakota": "SD", "Tennessee": "TN", "Texas": "TX",
  "Utah": "UT", "Vermont": "VT", "Virginia": "VA", "Washington": "WA",
  "West Virginia": "WV", "Wisconsin": "WI", "Wyoming": "WY",
};

interface StateData {
  name: string;
  col: number;
  housing: number;
  goods: number;
  services: number;
  rank: number;
}

interface StateColData {
  dataYear: number;
  generatedAt: string;
  colorScale: {
    min: number;
    max: number;
    midpoint: number;
  };
  states: Record<string, StateData>;
}

interface TopoJSONData extends Topology {
  objects: {
    states: GeometryCollection;
  };
}

interface TooltipState {
  visible: boolean;
  name: string;
  col: number;
  housing: number;
  goods: number;
  services: number;
  rank: number;
  x: number;
  y: number;
}

export function USStatesMap() {
  const router = useRouter();
  const [topoData, setTopoData] = useState<TopoJSONData | null>(null);
  const [stateColData, setStateColData] = useState<StateColData | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    name: "",
    col: 0,
    housing: 0,
    goods: 0,
    services: 0,
    rank: 0,
    x: 0,
    y: 0,
  });

  // Load TopoJSON data
  useEffect(() => {
    fetch("/data/us-states.json")
      .then((res) => res.json())
      .then((data) => setTopoData(data))
      .catch((err) => console.error("Failed to load map data:", err));
  }, []);

  // Load state COL data
  useEffect(() => {
    fetch("/data/state-col-data.json")
      .then((res) => res.json())
      .then((data) => setStateColData(data))
      .catch((err) => console.error("Failed to load COL data:", err));
  }, []);

  // Convert TopoJSON to GeoJSON
  const geoData = useMemo(() => {
    if (!topoData) return null;
    return feature(topoData, topoData.objects.states);
  }, [topoData]);

  // Get state data by state code
  const getStateData = (stateCode: string): StateData | null => {
    if (!stateColData) return null;
    return stateColData.states[stateCode] || null;
  };

  // Get state code from geography name
  const getStateCode = (geo: unknown): string | undefined => {
    const geography = geo as { properties?: { name?: string } };
    const stateName = geography.properties?.name;
    return stateName ? STATE_NAME_TO_CODE[stateName] : undefined;
  };

  // Handle state click
  const handleStateClick = (geo: unknown) => {
    const stateCode = getStateCode(geo);

    // Silently ignore clicks on geographies without state codes
    if (!stateCode) {
      return;
    }

    // Validate state code exists in our data
    const stateData = getStateData(stateCode);
    if (!stateData) {
      console.warn(`No data available for state: ${stateCode}`);
      return;
    }

    console.log("Navigating to state:", stateCode);
    router.push(`/state/${stateCode.toLowerCase()}`);
  };

  // Handle mouse move for tooltip
  const handleMouseMove = (event: React.MouseEvent, geography: unknown) => {
    const stateCode = getStateCode(geography);

    // Silently ignore if no state code
    if (!stateCode) return;

    const stateData = getStateData(stateCode);

    // Only show tooltip if we have data
    if (stateData) {
      setTooltip({
        visible: true,
        name: stateData.name,
        col: stateData.col,
        housing: stateData.housing,
        goods: stateData.goods,
        services: stateData.services,
        rank: stateData.rank,
        x: event.clientX,
        y: event.clientY,
      });
    }
  };

  // Handle mouse leave
  const handleMouseLeave = () => {
    setTooltip((prev) => ({ ...prev, visible: false }));
  };

  if (!geoData || !stateColData) {
    return (
      <div className="flex h-[600px] items-center justify-center">
        <div className="text-gray-400">Loading map...</div>
      </div>
    );
  }

  return (
    <>
      <div className="relative w-full overflow-hidden rounded-xl border border-white/5 bg-gradient-to-br from-purple-950/20 to-black/40 backdrop-blur-sm">
        <ComposableMap
          projection="geoAlbersUsa"
          className="h-auto w-full"
          style={{ width: "100%", height: "auto" }}
        >
          <ZoomableGroup center={[-96, 38]} zoom={1}>
            <Geographies geography={geoData}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const stateCode = getStateCode(geo);
                  const stateData = stateCode ? getStateData(stateCode) : null;
                  const fillColor = stateData
                    ? getMapColorForCOL(stateData.col)
                    : "#374151"; // gray-700 for missing data

                  // Determine if this geography is interactive
                  const isInteractive = stateCode && stateData;

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onClick={() => handleStateClick(geo)}
                      onMouseMove={(event) => handleMouseMove(event, geo)}
                      onMouseLeave={handleMouseLeave}
                      style={{
                        default: {
                          fill: fillColor,
                          stroke: "#1f2937",
                          strokeWidth: 0.5,
                          outline: "none",
                          cursor: isInteractive ? "pointer" : "default",
                        },
                        hover: {
                          fill: fillColor,
                          stroke: isInteractive ? "#fff" : "#1f2937",
                          strokeWidth: isInteractive ? 1.5 : 0.5,
                          outline: "none",
                          cursor: isInteractive ? "pointer" : "default",
                          filter: isInteractive ? "brightness(1.2)" : "none",
                        },
                        pressed: {
                          fill: fillColor,
                          stroke: isInteractive ? "#fff" : "#1f2937",
                          strokeWidth: isInteractive ? 2 : 0.5,
                          outline: "none",
                          cursor: isInteractive ? "pointer" : "default",
                        },
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
      </div>

      {/* Enhanced Tooltip with all category data */}
      <MapTooltip
        name={tooltip.name}
        col={tooltip.col}
        housing={tooltip.housing}
        goods={tooltip.goods}
        services={tooltip.services}
        rank={tooltip.rank}
        visible={tooltip.visible}
        x={tooltip.x}
        y={tooltip.y}
      />
    </>
  );
}