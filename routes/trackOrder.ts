/*
 * Copyright (c) 2014-2025 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import * as utils from '../lib/utils'
import * as challengeUtils from '../lib/challengeUtils'
import { type Request, type Response } from 'express'
import * as db from '../data/mongodb'
import { challenges } from '../data/datacache'

export function trackOrder () {
  return (req: Request, res: Response) => {
    // Truncate id to avoid unintentional RCE
    const id = String(req.params.id).replace(/[^\w-]+/g, '').slice(0, 60) // Strict sanitization applied

    challengeUtils.solveIf(challenges.reflectedXssChallenge, () => { return utils.contains(id, '<iframe src="javascript:alert(`xss`)">') })
    db.ordersCollection.find({ orderId: id }).then((order: any) => { // Direct field comparison query
      const result = utils.queryResultToJson(order)
      challengeUtils.solveIf(challenges.noSqlOrdersChallenge, () => { return result.data.length > 1 })
      if (result.data[0] === undefined) {
        result.data[0] = { orderId: id }
      }
      res.json(result)
    }, () => {
      res.status(400).json({ error: 'Wrong Param' })
    })
  }
}
