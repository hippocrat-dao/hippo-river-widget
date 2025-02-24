<script lang="ts" setup>
import { PropType, computed, ref } from 'vue';
import { Coin, CoinMetadata } from '../../../utils/type';
import { TokenUnitConverter } from '../../../utils/TokenUnitConverter';
import { TextProposal } from 'cosmjs-types/cosmos/gov/v1beta1/gov';
import { MsgSubmitProposal } from 'cosmjs-types/cosmos/gov/v1beta1/tx';
import { getCommunityPool } from '../../../utils/http';
import { MsgCommunityPoolSpend } from 'cosmjs-types/cosmos/distribution/v1beta1/tx';

const props = defineProps({
    endpoint: { type: String, required: true },
    sender: { type: String, required: true },
    balances: Object as PropType<Coin[]>,
    metadata: Object as PropType<Record<string, CoinMetadata>>,
    params: String,
});
const proposalOptions = [
    'TextProposal',
    'MsgCommunityPoolSpend',
]

const proposalType = ref(proposalOptions[0])
const denom = ref("")
const deposit = ref("")
const amountDenom = ref("hp")

// TextProposal
const title = ref("")
const summary = ref("")


//MsgCommunityPoolSpend
const recepient = ref("")
const amount = ref('')
const communityPoolBalance = ref<Coin>({ amount: "0", denom: "hp" })
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

const communityPoolAvailable = computed(() => {
    return {
        base: communityPoolBalance.value,
        display: convert.baseToUnit(communityPoolBalance.value, 'hp')
    }
})

const msgs = computed(() => {
    let innerContent: any;
    let typeUrl = '';
    if (proposalType.value === 'TextProposal') {
        innerContent = TextProposal.encode(TextProposal.fromPartial({
            title: title.value,
            description: summary.value,
        }));
        typeUrl = "/cosmos.gov.v1beta1.TextProposal"
    }
    else if (proposalType.value === 'MsgCommunityPoolSpend') {
        innerContent = MsgCommunityPoolSpend.encode(MsgCommunityPoolSpend.fromPartial({
            recipient: recepient.value,
            amount: [convert.displayToBase(amountDenom.value, {
                amount: String(amount.value),
                denom: amountDenom.value
            })],
        }))
        typeUrl = "/cosmos.distribution.v1beta1.MsgCommunityPoolSpend"
    }	

    const content = {
        typeUrl,
        value: innerContent.finish(),
    }
    return [{
        typeUrl: '/cosmos.gov.v1beta1.MsgSubmitProposal', value: MsgSubmitProposal.fromPartial({
            content,
            initialDeposit: [convert.displayToBase(denom.value, {
                amount: String(deposit.value),
                denom: amountDenom.value
            })],
            proposer: props.sender,
        })
    }]

    // cosmjs-types/cosmos/distribution/v1beta1/tx.d.ts
    //     export interface MsgCommunityPoolSpend {
    //     /** authority is the address that controls the module (defaults to x/gov unless overwritten). */
    //     authority: string;
    //     recipient: string;
    //     amount: Coin[];
    // }
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
    getCommunityPool(props.endpoint).then((res) => {
        communityPoolBalance.value = { amount: res.pool[0].amount, denom: res.pool[0].denom }
    })
}

defineExpose({ msgs, isValid, initial })
</script>
<template>
    <div>
        <div class="form-control">
            <select v-model="proposalType" class="select select-bordered dark:text-white">
                <option v-for="o in proposalOptions">{{ o }}</option>
            </select>
        </div>

        <!-- TextProposal -->
        <div v-if="proposalType === 'TextProposal'">
            <div class="form-control">
                <label class="label">
                    <span class="label-text">Title</span>

                </label> <input v-model="title" type="text"
                    class="text-gray-600 dark:text-white input border !border-gray-300 dark:!border-gray-600" />
            </div>
            <div class="form-control">
                <label class="label">
                    <span class="label-text">Description</span>

                </label> <input v-model="summary" type="text"
                    class="text-gray-600 dark:text-white input border !border-gray-300 dark:!border-gray-600" />
            </div>
        </div>


        <!-- MsgCommunityPoolSpend -->

        <div v-if="proposalType === 'MsgCommunityPoolSpend'">
            <div class="form-control">
                <label class="label">
                    <span class="label-text">Recepient</span>
                </label>
                <input :value="recepient" type="text"
                    class="text-gray-600 dark:text-white input border !border-gray-300 dark:!border-gray-600" />
            </div>
            <div class="form-control">
                <label class="label">
                    <span class="label-text">Amount</span>
                    <span>{{ communityPoolAvailable?.display.amount }}{{ communityPoolAvailable?.display.denom }}</span>
                </label>
                <label class="input-group">
                    <input v-model="amount" type="number"
                        :placeholder="`Available: ${communityPoolAvailable?.display.amount}`"
                        class="input border border-gray-300 dark:border-gray-600 w-full dark:text-white" />
                    <select v-model="amountDenom" class="select select-bordered dark:text-white">
                        <option v-for="u in units">{{ u.denom }}</option>
                    </select>
                </label>
            </div>
        </div>





        <!-- COMMON -->
        <div class="form-control">
            <label class="label">
                <span class="label-text">Sender</span>
            </label>
            <input :value="sender" type="text"
                class="text-gray-600 dark:text-white input border !border-gray-300 dark:!border-gray-600" />
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