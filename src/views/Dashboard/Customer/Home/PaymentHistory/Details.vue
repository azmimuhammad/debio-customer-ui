<template lang="pug">
  .payment-history-details
    ui-debio-modal(
      :show="!!messageError"
      :show-title="false"
      :show-cta="false"
      @onClose="$router.push({ name: 'customer-payment-history' })"
    )
      | {{ messageError }}

    .payment-history-details__wrapper(v-if="hasPaymentDetails")
      ui-debio-card(block centered-content)
        h2.payment-history-details__title {{ computeDetailsTitle }}
        .payment-history-details__content
          .payment-details__wrapper

            .payment-details__product
              ui-debio-avatar.product__image(:src="payment.service_info.image" size="150" rounded)
              .product__details
                .product__name {{ payment.service_info.name }}
                ui-debio-rating.product__lab-rating(
                  :rating="payment.rating.rating_service"
                  :total-reviews="payment.rating.count_rating_service"
                  size="15"
                )
                .product__lab-name {{ payment.lab_info.name }}
                .product__lab-address
                  span.address__title Address
                  p.address__text.mb-0 {{ payment.lab_info.address }}, {{ payment.lab_info.city }}

            .payment-details__status
              .payment-details__field
                .test__title Test status
                .test__status {{ payment.test_status || "-" }}
              .payment-details__field
                .payment__title Payment Status
                .payment__status {{ payment.status }}
              .payment-details__field
                .speciment__title Specimen number
                .speciment__status {{ payment.dna_sample_tracking_id }}

            .payment-details__instruction(v-if="payment.status === 'Paid'")
              ui-debio-icon.payment-details__instruction-icon(:icon="alertIcon" size="15" color="#52C41B" stroke)
              p.payment-details__instruction-text.mb-0
                | Please proceed to send sample, see instruction 
                span(class="payment-details__instruction-link" @click="handleSampleInstruction()") here!

            .payment-details__service
              .service__table
                .service__field
                  .service__field-title Service Price
                  .service__field-colon :
                  .service__field-value
                    | {{ formatPrice(payment.service_info.prices_by_currency[0].total_price) }}
                    | {{ payment.service_info.prices_by_currency[0].currency }}
                .service__field(v-if="payment.service_info.prices_by_currency[0].additional_prices.length")
                  .service__field-title Quality Control Price
                  .service__field-colon :
                  .service__field-value
                    | {{ formatPrice(payment.service_info.prices_by_currency[0].additional_prices[0].value) }}
                    | {{ payment.service_info.prices_by_currency[0].currency }}
                .service__field(v-if="payment.status === 'Refunded'")
                  .service__field-title Refund amount
                  .service__refund -
                .service__field
                  .service__field-title.d-flex.align-center
                    | Reward
                    .reward(@mouseleave="handleShowPopup('leave')")
                      ui-debio-icon.reward__icon.ml-1(
                        :icon="alertIcon"
                        size="10"
                        color="#6F6F6F"
                        stroke
                        @mouseenter="handleShowPopup('enter')"
                      )
                      .reward__popup(v-if="rewardPopup")
                        .reward__popup-text You will get the reward after your request test from requested service is completed/fulfilled
                  .service__field-colon :
                  .service__field-value - DBIO
            Button.payment-details__etherscan-link(
              color="secondary"
              @click="handleViewEtherscan"
              outlined
              block
            ) VIEW ON ETHERSCAN

</template>

<script>
import { alertIcon } from "@/common/icons"
import { fetchPaymentDetails, fetchTxHashOrder } from "@/common/lib/api";
import { getRatingService } from "@/common/lib/api"
import { queryDnaSamples } from "@/common/lib/polkadot-provider/query/genetic-testing"
import { mapState } from "vuex"

import {
  COVID_19,
  DRIED_BLOOD,
  URINE_COLLECTION,
  FECAL_COLLECTION,
  SALIVA_COLLECTION,
  BUCCAL_COLLECTION
} from "@/common/constants/instruction-step.js"

import metamaskServiceHandler from "@/common/lib/metamask/mixins/metamaskServiceHandler"

export default {
  name: "CustomerPaymentDetails",

  mixins: [metamaskServiceHandler],

  data: () => ({
    COVID_19,
    DRIED_BLOOD,
    URINE_COLLECTION,
    FECAL_COLLECTION,
    SALIVA_COLLECTION,
    BUCCAL_COLLECTION,

    alertIcon,
    messageError: null,
    rewardPopup: false,
    payment: {}
  }),

  computed: {
    ...mapState({
      api: (state) => state.substrate.api,
      rating: (state) => state.rating.rate,
      web3: (state) => state.metamask.web3
    }),

    computeDetailsTitle() {
      return this.payment?.status === "Paid"
        ? "Thank you for your order"
        : `${this.payment?.status} Order`
    },

    hasPaymentDetails() {
      return Object.keys(this.payment)?.length
    }
  },

  beforeMount() {
    if (!this.$route.params.id) this.$router.push({ name: "customer-payment-history" })
  },

  async created() {
    await this.fetchDetails()
  },

  methods: {
    async fetchDetails() {
      try {
        const dataPayment = await this.metamaskDispatchAction(fetchPaymentDetails, this.$route.params.id)
        const data = await queryDnaSamples(this.api, dataPayment.dna_sample_tracking_id)
        const rating = await getRatingService(dataPayment.service_id);

        this.payment = {
          ...dataPayment,
          test_status: data?.status.replace(/([A-Z]+)/g, " $1").trim(),
          rating
        }
      } catch(e) {
        if (e.response.status === 404)
          this.messageError = "Oh no! We can't find your selected order. Please select another one"

        else this.messageError = "Something went wrong. Please try again later"
      }
    },

    handleSampleInstruction() {
      const dnaCollectionProcess = this.payment.service_info.dna_collection_process

      if (dnaCollectionProcess === "Covid 19 Saliva Test") {
        window.open(this.COVID_19, "_blank")
      }
      if (dnaCollectionProcess === "Blood Cells - Dried Blood Spot Collection Process") {
        window.open(this.DRIED_BLOOD, "_blank")
      }
      if (dnaCollectionProcess === "Epithelial Cells - Buccal Swab Collection Process") {
        window.open(this.BUCCAL_COLLECTION, "_blank")
      }
      if (dnaCollectionProcess === "Fecal Matters - Stool Collection Process") {
        window.open(this.FECAL_COLLECTION, "_blank")
      }
      if (dnaCollectionProcess === "Saliva - Saliva Collection Process") {
        window.open(this.SALIVA_COLLECTION, "_blank")
      }
      if (dnaCollectionProcess === "Urine - Clean Catch Urine Collection Process") {
        window.open(this.URINE_COLLECTION, "_blank")
      }
    },

    handleShowPopup(val) {
      if (val === "enter") this.rewardPopup = true
      else this.rewardPopup = false
    },

    formatPrice(price) {
      return this.web3.utils.fromWei(String(price.replaceAll(",", "")), "ether")
    },

    async handleViewEtherscan() {
      const anchor = document.createElement("a")
      const orderId = this.payment?.id
      const { transaction_hash } = await fetchTxHashOrder(orderId)

      // NOTE: Use anchor tag with "noreferrer noopener" for security
      // eslint-disable-next-line camelcase
      anchor.href = `https://rinkeby.etherscan.io/tx/${transaction_hash}`
      anchor.target = "_blank"
      anchor.rel = "noreferrer noopener"
      anchor.click()
    }
  }
}
</script>

<style lang="sass" scoped>
  @import "@/common/styles/mixins.sass"
  @import "@/common/styles/function.sass"

  .payment-history-details
    &__title
      margin-top: 35px

    &__content
      min-width: 575px
      max-width: 800px
      padding: 30px
      margin-top: 60px
      border: 1px solid #E9E9E9
      border-radius: 4px

    &::v-deep
      .ui-debio-card__body
        display: flex
        flex-direction: column
        align-items: center
        padding-bottom: 100px

  .payment-details
    &__product
      display: flex
      gap: 25px

    &__status
      display: flex
      gap: 50px
      margin: 40px 0 25px

    &__instruction
      background: #E7FFDC
      display: flex
      align-items: center
      justify-content: center
      margin-bottom: 25px
      gap: 15px
      padding: 12px
      color: #52C41B

    &__instruction-link
      cursor: pointer
      text-decoration: underline
      color: #A568FF

    &__etherscan-link
      margin-top: toRem(30px)

  .product
    &__details
      width: calc(100% - 175px)
      display: flex
      flex-direction: column
      gap: 15px

    &__name
      @include h3-opensans

    &__lab
      width: 100%
      display: flex
      align-items: center
      justify-content: space-between
      gap: 80px
      
    &__lab-name
      @include body-text-2

  .address
    &__title
      @include body-text-medium-4

    &__text
      overflow: hidden
      display: -webkit-box
      -webkit-line-clamp: 2
      -webkit-box-orient: vertical
      color: #757274
      @include body-text-2

  .test__title,
  .payment__title,
  .speciment__title
    color: #595959
    @include body-text-4

  .test__status,
  .payment__status,
  .speciment__status
    @include body-text-medium-1

  .service
    &__table
      display: flex
      flex-direction: column

    &__field
      display: flex
      justify-content: space-between
      padding: 10px 40px
      background: #FCFCFC
      @include body-text-2

      &:nth-child(odd)
        background: #F6F7FB

    &__field-title
      flex: 1

    &__field-value
      flex: 1
      text-align: right
  .reward
    position: relative
    text-align: right

    &__popup
      width: 290px
      padding: 15px
      position: absolute
      font-size: 12px
      top: 23px
      left: -100px
      background: #FFFFFF
      border: 1px solid #E9E9E9

      &::before
        top: -22px
        content: ""
        display: block
        height: 20px
        left: 98px
        position: absolute
        border-color: transparent transparent #E9E9E9 transparent
        border-style: solid
        border-width: 11px

      &::after
        border-left: solid transparent 10px
        border-right: solid transparent 10px
        border-bottom: solid #FFFFFF 10px
        top: -10px
        content: " "
        height: 0
        left: 99px
        position: absolute
        width: 0

    &__popup-text
      text-align: left
</style>
