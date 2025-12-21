/**
 * Detailed Cost Breakdown Component
 * Shows actual monthly costs broken down by category
 */

import {
  Home,
  Car,
  ShoppingCart,
  Heart,
  Zap,
  Coffee,
  DollarSign,
} from "lucide-react";
import { CostCategory } from "./cost-category";

interface DetailedBreakdownProps {
  col: number;
  housing: number;
  goods: number;
  services: number;
}

// National monthly averages (in dollars)
const NATIONAL_AVERAGES = {
  housing: 1400, // Rent 2BR
  transportation: 800,
  food: 450, // Groceries
  healthcare: 400,
  utilities: 150,
  entertainment: 250, // Dining & Entertainment
  other: 300, // Miscellaneous
};

export function DetailedBreakdown({
  col,
  housing,
  goods,
  services,
}: DetailedBreakdownProps) {
  // Convert COL indices to multipliers (COL is already a percentage, so divide by 100)
  const housingMultiplier = housing / 100;
  const goodsMultiplier = goods / 100;
  const servicesMultiplier = services / 100;
  const colMultiplier = col / 100;

  // National average rent by bedroom count (estimated)
  const nationalRents = {
    studio: 1100,
    oneBedroom: 1300,
    twoBedroom: 1500,
    threeBedroom: 1800,
    fourBedroom: 2100,
  };

  // Calculate state-specific rents
  const stateRents = {
    studio: nationalRents.studio * housingMultiplier,
    oneBedroom: nationalRents.oneBedroom * housingMultiplier,
    twoBedroom: nationalRents.twoBedroom * housingMultiplier,
    threeBedroom: nationalRents.threeBedroom * housingMultiplier,
    fourBedroom: nationalRents.fourBedroom * housingMultiplier,
  };

  // Create housing details object
  const housingDetails = {
    studio: { national: nationalRents.studio, state: stateRents.studio },
    oneBedroom: { national: nationalRents.oneBedroom, state: stateRents.oneBedroom },
    twoBedroom: { national: nationalRents.twoBedroom, state: stateRents.twoBedroom },
    threeBedroom: { national: nationalRents.threeBedroom, state: stateRents.threeBedroom },
    fourBedroom: { national: nationalRents.fourBedroom, state: stateRents.fourBedroom },
    dataSource: "Estimated" as const,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">
          Monthly Cost Breakdown
        </h2>
        <p className="text-gray-400">
          Estimated monthly expenses based on national averages and state cost of
          living indices. Actual costs vary by lifestyle and specific location.
        </p>
      </div>

      {/* Category Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Housing */}
        <CostCategory
          categoryName="Housing"
          icon={<Home className="h-6 w-6" />}
          nationalAverage={NATIONAL_AVERAGES.housing}
          stateMultiplier={housingMultiplier}
          colorTheme="purple"
          itemsIncluded={[
            "2-bedroom apartment rent",
            "Property taxes (for renters)",
            "Renters insurance",
            "Maintenance fees",
          ]}
          housingDetails={housingDetails}
        />

        {/* Transportation */}
        <CostCategory
          categoryName="Transportation"
          icon={<Car className="h-6 w-6" />}
          nationalAverage={NATIONAL_AVERAGES.transportation}
          stateMultiplier={colMultiplier}
          colorTheme="blue"
          itemsIncluded={[
            "Car payment or lease",
            "Auto insurance",
            "Gas and fuel",
            "Maintenance and repairs",
            "Public transit passes",
          ]}
        />

        {/* Food & Groceries */}
        <CostCategory
          categoryName="Food & Groceries"
          icon={<ShoppingCart className="h-6 w-6" />}
          nationalAverage={NATIONAL_AVERAGES.food}
          stateMultiplier={goodsMultiplier}
          colorTheme="green"
          itemsIncluded={[
            "Groceries and household items",
            "Fresh produce and meats",
            "Packaged and canned goods",
            "Personal care products",
          ]}
        />

        {/* Healthcare */}
        <CostCategory
          categoryName="Healthcare"
          icon={<Heart className="h-6 w-6" />}
          nationalAverage={NATIONAL_AVERAGES.healthcare}
          stateMultiplier={servicesMultiplier}
          colorTheme="pink"
          itemsIncluded={[
            "Health insurance premiums",
            "Co-pays and deductibles",
            "Prescription medications",
            "Dental and vision care",
          ]}
        />

        {/* Utilities */}
        <CostCategory
          categoryName="Utilities"
          icon={<Zap className="h-6 w-6" />}
          nationalAverage={NATIONAL_AVERAGES.utilities}
          stateMultiplier={colMultiplier}
          colorTheme="yellow"
          itemsIncluded={[
            "Electricity",
            "Water and sewer",
            "Natural gas or heating oil",
            "Internet and phone",
          ]}
        />

        {/* Entertainment & Dining */}
        <CostCategory
          categoryName="Entertainment & Dining"
          icon={<Coffee className="h-6 w-6" />}
          nationalAverage={NATIONAL_AVERAGES.entertainment}
          stateMultiplier={servicesMultiplier}
          colorTheme="orange"
          itemsIncluded={[
            "Dining out and takeout",
            "Movies and events",
            "Streaming services",
            "Hobbies and recreation",
          ]}
        />

        {/* Other/Miscellaneous */}
        <CostCategory
          categoryName="Other & Miscellaneous"
          icon={<DollarSign className="h-6 w-6" />}
          nationalAverage={NATIONAL_AVERAGES.other}
          stateMultiplier={colMultiplier}
          colorTheme="blue"
          itemsIncluded={[
            "Clothing and apparel",
            "Personal services (haircuts, etc.)",
            "Pet care",
            "Miscellaneous expenses",
          ]}
        />
      </div>

      {/* Disclaimer */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
        <p className="text-sm text-gray-400">
          These estimates are based on national average spending patterns adjusted by
          state-specific cost of living indices. Individual expenses will vary
          significantly based on personal circumstances, lifestyle choices, and exact
          location within the state.
        </p>
      </div>
    </div>
  );
}
