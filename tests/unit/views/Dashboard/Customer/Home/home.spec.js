import { config, shallowMount } from "@vue/test-utils"
import Banner from "@/common/components/Banner"
import Card from "@/common/components/Card"
import Icon from "@/common/components/Icon"
import Vue from "vue"
import Vuetify from "vuetify"
import Vuex from "vuex"
import VueRouter from "vue-router"
import Home from "@/views/Dashboard/Customer/Home"
import DataTable from "@/common/components/DataTable"


jest.mock("../../../../../../src/common/lib/polkadot-provider/query/orders", () => ({
  ordersByCustomer: jest.fn(() => {
    return {
      length: 1,
      reverse: jest.fn(() => {
        return {
          length: 1
        }
      })
    }
  }),
  getOrdersData: jest.fn(() => {
    return {
      id: "0xd1531ceb36ecfc0afc3e1af6393d496ec67ad1be00c8fda19a46f3fc95142095",
      serviceId: "0x90a672ea5a9c171744c4dd86427da0ee6e9d7bca575baee160f0caf12b7f6c6d",
      customerId: "5G3gNkTpmv2dmnJs5je5tT2DpUy2w2yXtfUoAYwcaH7tVVnC",
      customerBoxPublicKey: "0x43b0644e304ef46dcf4cf4fd196504684f90513d8bee1bcfeb6d9565b764f068",
      sellerId: "5FFEr8P3DnLHzVybCYV4JsM9d9SmHCJZcMEMB9dBowcnUx4z",
      dnaSampleTrackingId: "S0PWOZERFRWCCJMAQZT10",
      currency: "DAI",
      prices: [
        {
          component: "testing_price",
          value: "2,000,000,000,000,000,000"
        }
      ],
      additionalPrices: [
        {
          component: "qc_price",
          value: "1,998,000,000,000,000,000"
        }
      ],
      status: "Cancelled",
      orderFlow: "RequestTest",
      createdAt: "1,643,000,820,001",
      updatedAt: "1,643,012,070,001"
    }
  })
}))

jest.mock("../../../../../../src/common/lib/polkadot-provider/query/genetic-testing", () => ({
  queryDnaSamples: jest.fn(() => {
    return {
      trackingId: "CU6F63ADJ9RTWF5J10CU6",
      labId:" 5FFEr8P3DnLHzVybCYV4JsM9d9SmHCJZcMEMB9dBowcnUx4z",
      ownerId: "5G3gNkTpmv2dmnJs5je5tT2DpUy2w2yXtfUoAYwcaH7tVVnC",
      status: "Registered",
      orderId: "0x6ad6f473bc381f5a2e56faf9f3a69c7cbee2fbe5f395420b4921be5ef0f33cb5",
      rejectedTitle: null,
      rejectedDescription: null,
      createdAt: "1,643,181,408,001",
      updatedAt: "1,643,181,408,001"
    }
  })
}))

jest.mock("../../../../../../src/common/lib/polkadot-provider/query/labs", () => ({
  queryLabsById: jest.fn(() => {
    return {
      accountId: "5EFb5C9AjhGnejq1f8k7bPGgAdQV4iM84EjwdopHhJidftfi",
      services: [
        "0xabd8224962152bae46333a82794c9b9d0654c57df1ba40cbc275fde415809b45"
      ],
      certifications: [],
      verificationStatus: "Verified",
      info: {
        boxPublicKey: "0x51cb06687e5ad5cd02ec278b555f9a58778e0c3a3e8b607814882c51931b1f72",
        name: "PT Diagnos Laboratorium Utama tbk",
        email: "email@diagnos.co.id",
        country: "ID",
        region: "JK",
        city: "Kota Administrasi Jakarta Timur",
        address: "Pekarangan Sunter no 4",
        phoneNumber: "+6282738927",
        website: "labutama.com",
        latitude: null,
        longitude: null,
        profileImage: null
      }
    }
  })
}))

jest.mock("../../../../../../src/common/lib/polkadot-provider/query/services", () => ({
  queryServicesById: jest.fn(() => {
    return {
      id: "0xabd8224962152bae46333a82794c9b9d0654c57df1ba40cbc275fde415809b45",
      ownerId: "5EFb5C9AjhGnejq1f8k7bPGgAdQV4iM84EjwdopHhJidftfi",
      info: {
        name: "Whole Genome Sequencing",
        pricesByCurrency: [
          {
            currency: "DAI",
            totalPrice: "4,000,000,000,000,000,000",
            priceComponents: [
              {
                component: "testing_price",
                value: "2,500,000,000,000,000,000"
              }
            ],
            additionalPrices: [
              {
                component: "qc_price",
                value: "1,500,000,000,000,000,000"
              }
            ]
          }
        ],
        expectedDuration: {
          duration: 7,
          durationType: "WorkingDays"
        },
        category: "Whole Genome Sequencing",
        description: "Analyze",
        dnaCollectionProcess: "Epithelial Cells",
        testResultSample: "https://ipfs.io/ipfs/QmSupjrhjxAazKMXMVzrDHEGhaeteCJBNWc8o3xBdCjPAR",
        longDescription: "Analyze",
        image: "https://ipfs.io/ipfs/QmcVYqPKp9ztSJ8TKqKY4gCDWtf4yPw712EdVQGwBhASMQ"
      },
      serviceFlow: "RequestTest"
    }
  })
}))

config.stubs["ui-debio-banner"] = { template: "<div></div>"}
config.stubs["ui-debio-card"] = { template: "<div></div>"}
config.stubs["ui-debio-icon"] = { template: "<div></div>"}

Vue.use(Vuetify)
Vue.use(Vuex)
let vuetify
let router
let store = new Vuex.Store({
  state: {
    substrate: {
      api: "API",
      wallet: "WALLET",
      mnemonicData: "enough essence liquid visa resemble cash laptop nose include shed slam thumb"
    },
    auth: {
      loadingData: "LOADING"
    },
    metamask: {
      web3: "WEB3"
    }
  }
})

describe("Home Page customer", () => {
  const stubs = { Banner, Card, Icon, DataTable }
  beforeEach(() => {
    const nodeCrypto = require("crypto")
    vuetify = new Vuetify()
    router = new VueRouter()

    global.crypto = {
      getRandomValues: (buffer) => { return nodeCrypto.randomFillSync(buffer) }
    }
  })

  it("Should render", () => {
    const wrapper = shallowMount(Home, {
      vuetify,
      router,
      stubs,
      store
    })

    expect(wrapper.exists()).toBe(true)
  })
})
