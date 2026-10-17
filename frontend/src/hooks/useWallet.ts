import { useQuery } from "@tanstack/react-query";
import { walletService } from "@/services/api/walletService";
import { queryKeys } from "@/lib/queryKeys";

export const useWallet = (page = 1, type?: string) => {
  return useQuery({
    queryKey: queryKeys.wallet.paginated(page, type),
    queryFn: () => walletService.getWallet(page, type),
  });
};
