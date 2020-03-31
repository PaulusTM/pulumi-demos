import * as random from "@pulumi/random";

const password1 = new random.RandomPassword("password1", {
    length: 30,
    special: true,
});

export const secretValue = password1.result;

const password2 = new random.RandomPassword("password2", {
    length: 30,
    special: true,
}, {
    additionalSecretOutputs: ["result"]
});

export const secretValue2 = password2.result