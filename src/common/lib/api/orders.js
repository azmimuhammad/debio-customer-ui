import apiClientRequest from "@/common/lib/api";
import localStorage from "@/common/lib/local-storage";

export async function fetchPaymentHistories(searchQuery) {
  const {
    data: {
      data
    }
  } = await apiClientRequest.get(`substrate/orders/list/${localStorage.getAddress()}`, {
    params: {
      size: 1000,
      page: 1,
      keyword: searchQuery || ""
    }
  })

  return data
}

export async function fetchPaymentDetails(hash) {
  const {
    data
  } = await apiClientRequest.get(
    `substrate/orders/${hash}`
  )

  return data
}

export async function fetchBountyLists(hash) {
  const { data: { data } } = await apiClientRequest.get(
    `substrate/orders/bounty_list/${hash}`
  )

  return data
}

export async function fetchTxHashOrder(orderId) {
  const { data: { data } } = await apiClientRequest.get("transaction/hash", {
    params: { order_id: orderId }
  })

  return data
}
