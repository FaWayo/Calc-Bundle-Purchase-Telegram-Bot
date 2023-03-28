import { DataBundles, MyContext} from "./types"
import { Markup } from "telegraf"
import fs from 'fs'
import {jsPDF} from "jspdf"

export function isInt(value: string){
    var er = /^-?[0-9]+$/
    return er.test(value)
}

export function isFourDigit(value: string){
    var er = /^[0-9]{4}$/
    return er.test(value)
}

export function isSixDigit(value: string){
  var er = /^[0-9]{6}$/
  return er.test(value)
}

export function isTenDigit(value: string){
  var er = /^[0-9]{10}$/
  return er.test(value)
}

export function isValidDate(value: string){
  var er = /^\d{4}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])$/
  return er.test(value)
}

export function performOperation(operation: string, input1: number, input2: number) {
    if (operation === "Add") {
      const result = input1 + input2
      return result
    }
    if (operation === "Subtract") {
      const result = input1 - input2
      return result
    }
    if (operation === "Multiply") {
      const result = input1 * input2
      return result
    }
    if (operation === "Divide") {
      const result = input1 / input2
      return result
    }
}

export function bundleOptionKeyboard(databundles: DataBundles[]){
    var keyboardBundles = new Array
    
    databundles.forEach(function(bundle, index){
        keyboardBundles.push(
           [ {text: `GH¢${bundle.price}  (${bundle.volume})`, callback_data: `${index}`} ]
        )
    })

    console.log(keyboardBundles)
    return keyboardBundles

}


export const consoleLogFile = new console.Console(fs.createWriteStream('./tg-bot.log')) 

 

export async function transConfirmRes(ctx: MyContext){
  let index = ctx.scene.session.databundle_index
  await ctx.reply(`Y'ello! The GH¢${ctx.scene.session.databundles[index].price} Data Bundle will give you ${ctx.scene.session.databundles[index].volume}.
This bundle does not expire.`, Markup.keyboard(
   [ [{text: 'Buy'}],[{text: 'Cancel'}]]
  ).resize().oneTime())
  return ctx.wizard.next()
}


function generatePDFReceipt(transactionRef:string, amount: string, quantity: string, receipientPhoneNumber: string){
  const doc = new jsPDF()
  doc.text(`Data Bundle Topup 

REF No: ${transactionRef}
Receipient: ${receipientPhoneNumber} 
Amount: GH¢${amount}
Bundle: ${quantity}`, 10 , 10)
  doc.save("receipt.pdf")
}


export async function transSuccessRes(ctx:MyContext, transactionRef:string) {
    const amount = ctx.scene.session.databundles[ctx.scene.session.databundle_index].price.toString()
    const bundle = ctx.scene.session.databundles[ctx.scene.session.databundle_index].volume
    const receipientPhoneNumber = ctx.scene.session.receipientPhoneNumber

   await ctx.reply(
    `Y'ello, you have successfully purchased GH¢${amount} Data Bundle and received ${bundle}.`, 
   )
   generatePDFReceipt(transactionRef, amount, bundle, receipientPhoneNumber)

   await ctx.replyWithDocument({source: "receipt.pdf"})
   await ctx.reply('Enter /menu to go back to the main menu')

  return ctx.scene.leave()
}


export const menuKeyboard = Markup.keyboard([
  [{text: 'Calculator'}],
  [{text: 'Buy Data'}]

])
.resize()
.oneTime()