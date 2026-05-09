import { useQuery } from "@tanstack/react-query";
import { walletService } from "@/services/api/walletService";

export const useWallet = (page = 1, type?: string) => {
  return useQuery({
    queryKey: ["wallet", page, type],
    queryFn: () => walletService.getWallet(page, type),
  });
};
