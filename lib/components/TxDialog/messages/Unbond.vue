<script lang="ts" setup>
import { PropType, computed, onMounted, ref } from 'vue';
import { getDelegations } from '../../../utils/http'
import { Coin, CoinMetadata } from '../../../utils/type';
import { TokenUnitConverter } from '../../../utils/TokenUnitConverter';

const props = defineProps({
    endpoint: {type: String, required: true },
    sender: {type: String, required: true},
    metadata: Object as PropType<Record<string, CoinMetadata>>,
    params: String,
});

const params = computed(() => JSON.parse(props.params || "{}"))
const delegation = ref({} as {balance: Coin, delegation: {delegator_address: string, shares: string, validator_address: string}})
const amount = ref("")
const amountDenom = ref("hp")
const error = ref("")

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

const msgs = computed(() => {
    return [{
        typeUrl: '/cosmos.staking.v1beta1.MsgUndelegate',
        value: {
          delegatorAddress: props.sender,
          validatorAddress: params.value.validator_address,
          amount: convert.displayToBase(delegation.value.balance?.denom, {
            amount: String(amount.value),
            denom: amountDenom.value,
          }),
        },
      }]
})

const units = computed(() => {
    return [{ denom: 'hp', exponent: 18, aliases: [] }];
})

const isValid = computed(() => {
    let ok = true
    let error = ""
    if(!props.sender) {
        ok = false
        error = "Sender is empty"
    }
    if(!params.value.validator_address) {
        ok = false
        error = "Validator is empty"
    }
    if(!(Number(amount.value) > 0)) {
        ok = false
        error = "Amount should be great than 0"
    }
    return { ok, error }
})

function initial() {
    getDelegations(props.endpoint, params.value.validator_address, props.sender).then(x => {
        delegation.value = x.delegation_response
    }).catch(err => {
        error.value = err
    })   
}

const available = computed(() => {
    const base = delegation.value?.balance || {amount: "", denom: ""}
    return {
        base,
        display: convert.baseToUnit(base, amountDenom.value),
    };
});

onMounted(() => {
    initial()
})

defineExpose({msgs, isValid, initial})
</script>
<template>
    <div>
        <div class="form-control">
            <label class="label">
                <span class="label-text">Sender</span>
            </label>
            <input :value="sender" type="text" class="text-gray-600 dark:text-white input border !border-gray-300 dark:!border-gray-600" />
        </div>
        <div class="form-control">
            <label class="label">
                <span class="label-text">Amount</span>
            </label>
            <label class="input-group">
                <input v-model="amount" type="number" :placeholder="`Avaiable: ${available.display?.amount}`" class="input border border-gray-300 dark:border-gray-600 w-full dark:text-white" />
                <select v-model="amountDenom" class="select select-bordered dark:text-white">
                    <option v-for="u in units">{{ u.denom }}</option>
                </select>
            </label>
        </div>
        <div class="text-error">{{ error }}</div>
    </div>
</template>