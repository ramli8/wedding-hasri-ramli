/**
 * @file LanguageProvider.tsx
 * @description This is the language provider. It is used to provide the language to the app.
 * @module base
 * @author [Fikri Haykal for DPTSI ITS]
 * @version 1.5.14
 **/

import langEn from '@/lang/en'
import langId from '@/lang/id'
import { NextIntlClientProvider } from 'next-intl'
import { ReactNode, useContext } from 'react'
import AppSettingContext from './AppSettingProvider'

const LanguageProvider = ({ children }: { children: ReactNode }) => {
    const { langPref } = useContext(AppSettingContext)
    const messages = new Map([
        ['id', langId],
        ['en', langEn]
    ])

    return (
        <NextIntlClientProvider
            locale={langPref}
            timeZone={process.env.NEXT_PUBLIC_SERVER_TZ ?? 'Asia/Jakarta'}
            messages={messages.get(langPref) ?? {}}
        >
            {children}
        </NextIntlClientProvider>
    )
}

export default LanguageProvider
