"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  Customer,
  PartSearchResult,
  SettingOption,
  Supplier,
} from "@/components/orders/types/orderBuilderTypes";

export function usePartSearch() {
  const [q, setQ] = useState("");
  const [searchResults, setSearchResults] = useState<PartSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [partQualityTypes, setPartQualityTypes] = useState<SettingOption[]>([]);

  useEffect(() => {
    fetch("/api/suppliers")
      .then((response) => response.json())
      .then((data) => setSuppliers(data.suppliers ?? []));
    fetch("/api/customers")
      .then((response) => response.json())
      .then((data) => setCustomers(data.customers ?? []));
    fetch("/api/settings/options?kind=part_quality_type")
      .then((response) => response.json())
      .then((data) => setPartQualityTypes(data.options ?? []));
  }, []);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    const response = await fetch(`/api/parts?q=${encodeURIComponent(query)}&take=20`);
    const data = await response.json();
    setSearchResults(data.parts ?? []);
    setSearching(false);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => search(q), 300);
    return () => clearTimeout(timeout);
  }, [q, search]);

  return {
    q,
    setQ,
    searchResults,
    setSearchResults,
    searching,
    suppliers,
    customers,
    partQualityTypes,
  };
}
