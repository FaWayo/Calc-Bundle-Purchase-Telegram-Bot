import { Scenes } from "telegraf"

export interface DataBundles {
    bundleId: number
    price: number
    volume: string
}

export interface MyWizardSession extends Scenes.WizardSessionData{
    //calculator scene
    input1: number
    input2: number
    operation: string
    //data bundle scene
    telegramUserId: string | undefined
    databundles: DataBundles[]
    databundle_index: number
    receipientPhoneNumber: string
    //onboarding scene
    firstName: string,
    lastName: string,
    userName: string,
    phoneNumber: string
    dateOfBirth: string
    gender: string
    pinNumber: string
}

export type PurchaseTranPayload = {
    telegramUserId: string | undefined,
    receipientPhoneNumber: string,
    bundleId:number
}

export type CheckCustomerPayload = {
    telegramUserId: string
}

export type sendOTPPayload = {
    phoneNumber: string
}

export type verifyOTPPayload = {
    otpCode: string
}

export type GetTokenPayload = {
    userName: string,
    userPassword: string
}

export type AddCustomerPayload = {
    firstName: string,
    lastName: string,
    phoneNumber: string,
    telegramUserId: string,
    pinNumber: string, 
    userName: string | undefined,
    dateOfBirth: string,
    gender: string
}

export type transactionRef = string
export type isMatches = boolean

export type MyContext = Scenes.WizardContext<MyWizardSession>



