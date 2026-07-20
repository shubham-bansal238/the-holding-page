import { useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAllCustomers, syncCustomersFromInvoices } from "@/services/customerService";
import { fetchAllInvoices } from "@/services/invoiceService";
import { isAfterCutoff } from "@/lib/period";

export function useCustomersData() {
  const qc = useQueryClient();

  const customersQuery = useQuery({
    queryKey: ["customers"],
    queryFn: fetchAllCustomers,
  });

  const invoicesQuery = useQuery({
    queryKey: ["invoices"],
    queryFn: fetchAllInvoices,
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const invoices = invoicesQuery.data ?? (await fetchAllInvoices());
      return syncCustomersFromInvoices(invoices);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
    },
  });

  // Auto-sync only when new invoices exist that aren't tracked in any customer doc.
  const didAutoSync = useRef(false);
  useEffect(() => {
    if (didAutoSync.current) return;
    if (syncMutation.isPending) return;
    const customers = customersQuery.data;
    const invoices = invoicesQuery.data;
    if (!customers || !invoices) return;

    const known = new Set<string>();
    for (const c of Object.values(customers)) {
      for (const num of Object.keys(c.invoices ?? {})) known.add(num);
    }
    const hasNew = invoices.some((inv) => {
      const num = inv.invoiceNumber ?? inv.id;
      return (
        num &&
        !known.has(num) &&
        !!inv.consignee?.gstin?.trim() &&
        isAfterCutoff(inv.invoiceDate)
      );
    });
    if (hasNew) {
      didAutoSync.current = true;
      syncMutation.mutate();
    } else {
      didAutoSync.current = true;
    }
  }, [customersQuery.data, invoicesQuery.data, syncMutation]);

  return { customersQuery, syncMutation };
}