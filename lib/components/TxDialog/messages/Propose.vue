<script lang="ts" setup>
import { PropType, computed, ref } from 'vue';
import { Coin, CoinMetadata } from '../../../utils/type';
import { TokenUnitConverter } from '../../../utils/TokenUnitConverter';

const props = defineProps({
    endpoint: { type: String, required: true },
    sender: { type: String, required: true },
    balances: Object as PropType<Coin[]>,
    metadata: Object as PropType<Record<string, CoinMetadata>>,
    params: String,
});

const denom = ref("")
const deposit = ref("")
const amountDenom = ref("hp")
const propose_metadata = ref("")
const title = ref("")
const summary = ref("")
const messages = ref("{}")

const convert = new TokenUnitConverter(
    // below can be simplied to props.metadata if metadata api works.
    {
        ahp: {
            name: 'hp',
            description: 'The native staking token of the Hippo Protocol.',
            denom_units: [
                {
                    denom: 'ahp',
                    exponent: 0,
                    aliases: [],
                },
                {
                    denom: 'hp',
                    exponent: 18,
                    aliases: [],
                },
            ],
            base: 'ahp',
            display: 'hp',
            symbol: 'hp',
        },
    }
);

const available = computed(() => {
    const base = props.balances?.find(x => x.denom === denom.value) || { amount: "0", denom: denom.value }
    return {
        base,
        display: convert.baseToUnit(base, amountDenom.value)
    }
})

const msgs = computed(() => {
    return [{
        typeUrl: '/cosmos.gov.v1beta1.MsgSubmitProposal',
        value: {
            messages: messages.value,
            initial_deposit: convert.displayToBase(denom.value, {
                amount: String(deposit.value),
                denom: amountDenom.value
            }),
            proposer: props.sender,
            metadata: propose_metadata.value,
            title: '',
            summary: ''
        },
    }]
})

const units = computed(() => {
    return [{ denom: 'hp', exponent: 18, aliases: [] }];
})

const isValid = computed(() => {
    let ok = true
    let error = ""

    if (!(Number(deposit.value) > 0)) {
        ok = false
        error = "Initial deposit should be great than 0"
    }
    return { ok, error }
})

function initial() {
    denom.value = 'ahp'
}

defineExpose({ msgs, isValid, initial })
</script>
<template>
    <div>
        <div class="form-control">
            <label class="label">
                <span class="label-text">Sender</span>
            </label>
            <input :value="sender" type="text"
                class="text-gray-600 dark:text-white input border !border-gray-300 dark:!border-gray-600" />
        </div>

        <div class="form-control">
            <label class="label">
                <span class="label-text">Messages</span>
                <input v-model="messages" type="text"
                    class="text-gray-600 dark:text-white input border !border-gray-300 dark:!border-gray-600" />
            </label>
        </div>
        <div class="form-control">
            <label class="label">
                <span class="label-text">Metadata</span>
                <input v-model="propose_metadata" type="text"
                    class="text-gray-600 dark:text-white input border !border-gray-300 dark:!border-gray-600" />
            </label>
        </div>
        <div class="form-control">
            <label class="label">
                <span class="label-text">Title</span>
                <input v-model="title" type="text"
                    class="text-gray-600 dark:text-white input border !border-gray-300 dark:!border-gray-600" />
            </label>
        </div>
        <div class="form-control">
            <label class="label">
                <span class="label-text">Summary</span>
                <input v-model="summary" type="text"
                    class="text-gray-600 dark:text-white input border !border-gray-300 dark:!border-gray-600" />
            </label>
        </div>
        <div class="form-control">
            <label class="label">
                <span class="label-text">Initial Deposit</span>
                <span>{{ available?.display.amount }}{{ available?.display.denom }}</span>
            </label>
            <label class="input-group">
                <input v-model="deposit" type="number" :placeholder="`Available: ${available?.display.amount}`"
                    class="input border border-gray-300 dark:border-gray-600 w-full dark:text-white" />
                <select v-model="amountDenom" class="select select-bordered dark:text-white">
                    <option v-for="u in units">{{ u.denom }}</option>
                </select>
            </label>
        </div>
    </div>
</template>