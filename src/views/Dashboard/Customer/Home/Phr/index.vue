<template lang="pug">
.customer-phr
  ui-debio-error-dialog(
    :show="!!error"
    :title="error ? error.title : ''"
    :message="error ? error.message : ''"
    @close="error = null"
  )

  ui-debio-modal(
    :show="showModal"
    :show-title="false"
    @onClose="showModal = false"
  )
    h2.mb-10 Delete
    ui-debio-icon.mb-8(:icon="alertTriangleIcon" stroke size="80")
    p.modal-password__subtitle(v-if="selectedFile") You might not be retrieved back, are you sure you want to delete this PHR ?

    p.modal-password__tx-info.mb-0.d-flex
      span.modal-password__tx-text.mr-6.d-flex.align-center
        | Estimated transaction weight
        ui-debio-icon.ml-1(
          :icon="alertIcon"
          size="14"
          stroke
          @mouseenter="handleShowTooltip"
        )
        span.modal-password__tooltip(
          @mouseleave="handleShowTooltip"
          :class="{ 'modal-password__tooltip--show': showTooltip }"
        ) Total fee paid in DBIO to execute this transaction.
      span.modal-password__tx-value {{ txWeight }}

    .modal-password__cta.d-flex(slot="cta")
      ui-debio-button(
        block
        color="secondary"
        :loading="isLoading"
        @click="onDelete"
      ) Delete

  ui-debio-banner(
    title="My PHR"
    subtitle="Upload a collection of your Personal Health Records that involved in your medical history (diagnoses, treatment plans, immunization, allergies, radiology and laboratory)."
    gradient-color="primary"
    with-decoration
  )
    template(slot="illustration")
      ui-debio-icon.banner-illustration(:icon="analiticIllustration" :size="cardBlock ? 250 : 180" view-box="0 0 252 252" fill)

  ui-debio-data-table(
    :headers="headers"
    :loading="isLoading"
    :items="phrDocuments"
  )
    template(slot="prepend")
      .customer-phr__nav
        .customer-phr__nav-text
          h2.customer-phr__title My PHR List
          p.customer-phr__subtitle.mb-0 List of My Personal Health Records
    template(v-slot:[`item.title`]="{ item }")
      .d-flex.flex-column
        span.customer-phr__document-title(:title="item.title") {{ item.title }}

    template(v-slot:[`item.category`]="{ item }")
      .d-flex.flex-column
        span.customer-phr__document-category(:title="item.category") {{ item.category }}

    template(v-slot:[`item.documentTitle`]="{ item }")
      .d-flex.flex-column
        span.customer-phr__file-title(v-for="(file, idx) in item.files" :title="file.title") {{ idx + 1 }}. {{ file.title }}

    template(v-slot:[`item.documentDescription`]="{ item }")
      .d-flex.flex-column
        span.customer-phr__file-description(v-for="(file, idx) in item.files" :title="file.description") {{ idx + 1 }}. {{ file.description }}

    template(v-slot:[`item.createdAt`]="{ item }")
      span {{ item.createdAt }}

    template(v-slot:[`item.actions`]="{ item }")
      .customer-phr__actions
        ui-debio-icon(:icon="pencilIcon" size="16" role="button" stroke @click="onEdit(item)")
        ui-debio-icon(:icon="eyeIcon" size="16" role="button" stroke @click="onDetails(item)")
        ui-debio-icon(:icon="trashIcon" size="16" role="button" stroke @click="handleOpenModalDelete(item)")
</template>

<script>
import { mapState } from "vuex"
import {
  layersIcon,
  analiticIllustration,
  eyeIcon,
  pencilIcon,
  eyeOffIcon,
  alertTriangleIcon,
  alertIcon,
  trashIcon,
  downloadIcon
} from "@debionetwork/ui-icons"
import {
  queryElectronicMedicalRecordByOwnerId,
  queryElectronicMedicalRecordFileById,
  deregisterElectronicMedicalRecord,
  deregisterElectronicMedicalRecordFee
} from "@debionetwork/polkadot-provider"
import CryptoJS from "crypto-js"
import Kilt from "@kiltprotocol/sdk-js"
import { u8aToHex } from "@polkadot/util"
import { errorHandler } from "@/common/lib/error-handler"
import metamaskServiceHandler from "@/common/lib/metamask/mixins/metamaskServiceHandler"

export default {
  name: "CustomerPHR",
  mixins: [metamaskServiceHandler],


  data: () => ({
    layersIcon,
    analiticIllustration,
    eyeIcon,
    pencilIcon,
    eyeOffIcon,
    trashIcon,
    downloadIcon,
    alertIcon,
    alertTriangleIcon,

    cardBlock: false,
    showModal: false,
    showModalPassword: false,
    showPassword: false,
    showTooltip: false,
    selectedFile: null,
    error: null,
    txWeight: null,
    publicKey: null,
    secretKey: null,
    headers: [
      {
        text: "PHR Title",
        value: "title",
        sortable: true
      },
      {
        text: "Category",
        value: "category",
        sortable: true
      },
      {
        text: "Document Title",
        value: "documentTitle",
        sortable: true
      },
      {
        text: "Description",
        value: "documentDescription",
        sortable: true
      },
      {
        text: "Upload Date",
        value: "createdAt",
        align: "center",
        sortable: true
      },
      {
        text: "Action",
        value: "actions",
        align: "center"
      }
    ],
    phrDocuments: []
  }),

  computed: {
    ...mapState({
      api: (state) => state.substrate.api,
      wallet: (state) => state.substrate.wallet,
      mnemonicData: (state) => state.substrate.mnemonicData,
      lastEventData: (state) => state.substrate.lastEventData,
      loadingData: (state) => state.auth.loadingData,
      web3: (state) => state.metamask.web3
    })
  },

  watch: {
    lastEventData() {
      if (this.lastEventData !== null) {
        const dataEvent = JSON.parse(this.lastEventData.data.toString())

        if (this.lastEventData.method === "ElectronicMedicalRecordRemoved") {
          if (dataEvent[1] === this.wallet.address) this.getPHRHistory()
        }
      }
    },

    mnemonicData(val) {
      if (val) this.initialDataKey()
    }
  },

  mounted() {
    window.addEventListener("resize", () => {
      if (window.innerWidth <= 959) this.cardBlock = true
      else this.cardBlock = false
    })
  },

  async created() {
    if (this.mnemonicData) this.initialDataKey()
    await this.metamaskDispatchAction(this.getPHRHistory)
  },

  methods: {
    initialDataKey() {
      const cred = Kilt.Identity.buildFromMnemonic(this.mnemonicData.toString(CryptoJS.enc.Utf8))

      this.publicKey = u8aToHex(cred.boxKeyPair.publicKey)
      this.secretKey = u8aToHex(cred.boxKeyPair.secretKey)
    },

    async getPHRHistory() {
      this.showModal = false
      this.isLoading = true
      const documents = []

      try {
        const dataPHR = await queryElectronicMedicalRecordByOwnerId(this.api, this.wallet.address)

        if (dataPHR !== null || !dataPHR?.length) {
          const listPHR = dataPHR.reduce((filtered, current) => {
            if (filtered.every(v => v.id !== current.id)) filtered.push(current)

            return filtered
          }, [])

          listPHR.reverse()

          for (const phrDetail of listPHR) {
            const documentDetail = await this.preparePHRData(phrDetail)
            documents.push(documentDetail)
          }
        }

        this.phrDocuments = documents
        this.isLoading = false
      } catch (error) {
        this.isLoading = false
        console.error(error);
      }
    },

    async preparePHRData(dataPHR) {
      let files = []

      for (let i = 0; i < dataPHR.files?.length; i++) {
        const file = await this.metamaskDispatchAction(queryElectronicMedicalRecordFileById,
          this.api,
          dataPHR.files[i]
        )

        dataPHR.createdAt = new Date(+file.uploadedAt.replaceAll(",", "")).toLocaleDateString("id", {
          day: "2-digit",
          month: "short",
          year: "numeric"
        })

        files.push({
          ...file,
          createdAt: new Date(+file.uploadedAt.replaceAll(",", "")).toLocaleDateString("id", {
            day: "2-digit",
            month: "short",
            year: "numeric"
          }),
          recordLink: file.recordLink
        })
      }

      return {
        id: dataPHR.id,
        title: dataPHR.title,
        category: dataPHR.category,
        createdAt: dataPHR.createdAt,
        files: files?.slice(0, 3)
      }
    },

    onEdit(phr) {
      this.$router.push({ name: "customer-phr-edit", params: { id: phr.id }})
    },

    onDetails(phr) {
      this.$router.push({ name: "customer-phr-details", params: { id: phr.id }})
    },

    handleShowPassword() {
      this.showPassword = !this.showPassword
    },

    async handleOpenModalDelete(item) {
      this.selectedFile = item
      this.showModal = true

      const txWeight = await deregisterElectronicMedicalRecordFee(this.api, this.wallet, item.id)
      this.txWeight = `${Number(this.web3.utils.fromWei(String(txWeight.partialFee), "ether")).toFixed(4)} DBIO`
    },

    handleShowTooltip(e) {
      if (e.type === "mouseenter") {
        this.showTooltip = true
      } else {
        this.showTooltip = false
      }
    },

    async onDelete() {
      const { id } = this.selectedFile
      this.isLoading = true

      try {
        await deregisterElectronicMedicalRecord(this.api, this.wallet, id)
        this.error = null
        this.selectedFile = null
      } catch (e) {
        const error = await(errorHandler(e.message))
        this.isLoading = false
        this.error = error
      }
    }
  }
}
</script>

<style lang="sass" scoped>
  @import "@/common/styles/mixins.sass"

  .customer-phr
    display: flex
    flex-direction: column
    gap: 30px

    &__actions
      display: flex
      align-items: center
      justify-content: center
      gap: 20px

    &::v-deep
      .banner__subtitle
        max-width: 36.188rem !important

      .ui-debio-modal__card
        gap: 20px

    &__document-title,
    &__document-category,
    &__file-title,
    &__file-description
      max-width: 150px
      white-space: pre
      overflow: hidden
      text-overflow: ellipsis

    .modal-password
      &__subtitle
        max-width: 280px
        @include body-text-2-opensans

      &__tx-text,
      &__tx-value
        position: relative
        @include body-text-3-opensans

      &__tooltip
        max-width: 143px
        padding: 10px
        position: absolute
        top: 35px
        z-index: 10
        background: #fff
        border: 1px solid #D3C9D1
        right: -120px
        transition: all .3s ease-in-out
        visibility: hidden
        opacity: 0
        @include tiny-reg

        &::after
          position: absolute
          content: ""
          display: block
          top: -20px
          height: 20px
          border-color: transparent transparent #FFF transparent
          border-style: solid
          border-width: 8px

        &::before
          position: absolute
          content: ""
          display: block
          top: -21px
          height: 20px
          border-color: transparent transparent #D3C9D1 transparent
          border-style: solid
          border-width: 8px

        &--show
          opacity: 1
          visibility: visible

      &__cta
        gap: 20px
</style>
