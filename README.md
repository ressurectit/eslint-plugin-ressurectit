[![npm version](https://badge.fury.io/js/eslint-plugin-ressurectit.svg)](https://badge.fury.io/js/eslint-plugin-ressurectit)
[![Build status](https://ci.appveyor.com/api/projects/status/rte0wrgbgsbxhmjf?svg=true)](https://ci.appveyor.com/project/kukjevov/eslint-plugin-ressurectit)
# eslint-plugin-ressurectit

RessurectIT specific ESlint rules

## Installation

You'll first need to install [ESLint](http://eslint.org):

```
$ npm i eslint --save-dev
```

Next, install `eslint-plugin-ressurectit`:

```
$ npm install eslint-plugin-ressurectit --save-dev
```


## Usage

Add `ressurectit` to the plugins section of your `.eslintrc` configuration file. You can omit the `eslint-plugin-` prefix:

```json
{
    "plugins": [
        "ressurectit"
    ]
}
```


Then configure the rules you want to use under the rules section.

```json
{
    "rules": {
        "ressurectit/rule-name": 2
    }
}
```

## Supported Rules

* Fill in provided rules here





