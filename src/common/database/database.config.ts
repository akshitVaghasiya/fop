// import 'dotenv/config';
// import { SequelizeModuleOptions } from '@nestjs/sequelize';
// import { User } from '../models/users.model';
// import { Item } from '../models/item.model';
// import { ItemInterests } from '../models/item-interest.model';
// import { UserPreference } from '../models/user-preference.model';
// import { UserProfile } from '../models/user-profile.model';
// import { Chat } from '../models/chat.model';
// import { ProfileViewRequests } from '../models/profile-view-permission.model';
// import { Role } from '../models/role.model';
// import { AuthChild } from '../models/auth-child.model';
// import { AuthItem } from '../models/auth-item.model';

// export const sequelizeConfig: SequelizeModuleOptions = {
//     dialect: 'postgres',
//     host: process.env.DB_HOST,
//     port: Number(process.env.DB_PORT),
//     username: process.env.DB_USERNAME,
//     password: process.env.DB_PASSWORD,
//     database: process.env.DB_NAME,
//     models: [User, Item, UserProfile, ItemInterests, UserPreference, Chat, ProfileViewRequests, Role, AuthChild, AuthItem],
//     synchronize: true,
//     autoLoadModels: true,
//     // logging: false,
//     logging: (msg) => console.log(msg),
//     // sync: { force: true },
// };


import 'dotenv/config';
import { SequelizeModuleOptions } from '@nestjs/sequelize';
import { User } from '../models/users.model';
import { Item } from '../models/item.model';
import { ItemInterests } from '../models/item-interest.model';
import { UserPreference } from '../models/user-preference.model';
import { UserProfile } from '../models/user-profile.model';
import { Chat } from '../models/chat.model';
import { ProfileViewRequests } from '../models/profile-view-permission.model';
import * as fs from 'fs';
import { join } from 'path';

const caCertificate = `-----BEGIN CERTIFICATE-----
MIIETTCCArWgAwIBAgIUZMyjJb1yO/cHyv58KRof/32+IkYwDQYJKoZIhvcNAQEM
BQAwQDE+MDwGA1UEAww1MDAzMTkyNDUtN2NhMC00NDU0LWI3NjYtYWNkNjVhZTRm
ODNkIEdFTiAxIFByb2plY3QgQ0EwHhcNMjUwNDMwMDQwMTUwWhcNMzUwNDI4MDQw
MTUwWjBAMT4wPAYDVQQDDDUwMDMxOTI0NS03Y2EwLTQ0NTQtYjc2Ni1hY2Q2NWFl
NGY4M2QgR0VOIDEgUHJvamVjdCBDQTCCAaIwDQYJKoZIhvcNAQEBBQADggGPADCC
AYoCggGBANVp/9FK4g6KuQB6wE9DWrxqpWeUp1I9qpT6pZMcF3zW/Xdu3c0D0PN5
qzs4mIbIXTs0SGNpD9qv2fVD500XpyDYdjpu1wL+35nEKVyLGm+60rdVda5EFozW
noT/7RYcwvzcUrhA1ybinEfCMsRfMQjInYqIia+w3X1eWen63JG8viREOtpcl6No
0w9b1crOr12pblk1xGpZMoOJOaH2OmgKk/hQaIfoA4/rus3xWoZ2AuDxNixJnUk/
HS9r/A4Pn3Wcq3H3+Z1Ogi/OMmrek7YzFpmBKlNYne+ARvtBKnoONQ8RlO6deoFn
M/sC/zXJdsmMgrlcwDqizFRZHwP5HwlWK7toF920YKN6qLeHRBV+yKEC48s56+Ue
qYgRFyzWTtjOkKIZK4X8AtJnJMW4TWokMIIm5+m2CxshyLaAhNeeOJzSGR75Obiy
bDbXpni000QqEaz6sYlSam1UzaPpA5Ch5VOAI7UGZCCMmn4KxaFsfPmffGAXzRVt
edx96KvFIwIDAQABoz8wPTAdBgNVHQ4EFgQUYvj8PPm8A+jK6kmMvc3PdfV8A8Ew
DwYDVR0TBAgwBgEB/wIBADALBgNVHQ8EBAMCAQYwDQYJKoZIhvcNAQEMBQADggGB
AKPIXr5N/iYGVbfsBfZB9oYwFmxudmLCynj8VgsUqOtUw91OdRcuGw/fOOJptptE
nKThXYTVhP7uJUY/IIRmwB5USAcFXCYwUXRHrUtZns5kHnJsItiX+7ecNqIN+s8N
S87f9YjNAeKRtick4UFD/mlqu0vPJC3JZUKN4LQpzwTieTtSBvYFecT6dksKt9Eh
If3sho4rL4qPHuRkjRsap50v3Yt0zwdHBLaMUxS6c5CzWCSAnTrnUyLf8macjahm
roh9sMm3toVbYQiVPP5HWfQQEQ+3llc42+Zze16tX+s2zR45yZRxNTkOMhY6Ht4u
jmCexGXnBt/Xm2CQYinMf2UPLRStW3LKNiqVKwnwMWONujX63h/q/OagYwzJjEo8
WcLB62czWogjqSq+oqBLQf0+DoBSyi3M2dzGBqUp/r9LQ0FkKf8KI/SxvTMMyaoD
xjB61s7YQk6SdG5xqiPyw173rJvAbfHrUYR+584vpyCDX1Ig5sizHxvehNO9TIGl
hA==
-----END CERTIFICATE-----
`;

const caCert = Buffer.from(process.env.PG_CA_CERT_BASE64!, 'base64').toString('utf-8');

export const sequelizeConfig: SequelizeModuleOptions = {
    dialect: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    models: [User, Item, UserProfile, ItemInterests, UserPreference, Chat, ProfileViewRequests],
    synchronize: true,
    autoLoadModels: true,
    logging: (msg) => console.log(msg),
    sync: { force: true },
    ssl: true,
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: true,
            ca: caCertificate,
        },
    },
};