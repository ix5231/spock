# spock

## ソースコードの取得

### 1. gitを取得

Windows: [Git for Windows](https://git-for-windows.github.io/)

### 2. コードをCloneする

Windowsの場合はコマンドプロンプト、macOS/Linuxの場合は端末で

```
> git clone https://github.com/ix5231/spock [保存先(任意)]
```

## 実行

実行には[nodejs](https://nodejs.org/ja/)が必要

Windowsの場合はコマンドプロンプト、macOS/Linuxの場合は端末で

```
> npm dev build
> npm dev run
```

それぞれ別々の端末でやると捗る
どちらのコマンドを使う際もこのプロジェクトのディレクトリをカレントディレクトリにすること

### 注意

初回のみ以下のコマンドが必要
```
> npm install -g typescript
> npm install
```

## コードの共有

### 注意

1. VSCodeの機能を使う[方法](https://azriton.github.io/2017/08/23/Visual-Studio-Code%E3%81%A7Git%E3%82%92%E4%BD%BF%E3%81%86/)もある
2. commit時、初回の場合、以下のようなエラーメッセージが表示されることがある
```
*** Please tell me who you are.

Run

  git config --global user.email "you@example.com"
  git config --global user.name "Your Name"

to set your account's default identity.
Omit --global to set the identity only in this repository.

fatal: empty ident name (for <hoge_app@personal.hoge>) not allowed
```
これはgitが「あなたはだあれ？」と聞いているので名前を教えてあげるとよい
```
git config --global user.email "[あなたのメールアドレス、githubで登録したものが望ましい]"
git config --global user.name "[あなたの名前、githubで登録したものが望ましい]"
```

### 1. commitする

Windowsの場合はコマンドプロンプト、macOS/Linuxの場合は端末で
```
> git commit -am "[メッセージ、何をしたのか、変更したところとか]"
```

### 2. pushする

Windowsの場合はコマンドプロンプト、macOS/Linuxの場合は端末で
```
> git push origin master
```
githubのユーザ名とパスワードが聞かれたら入力する

### Tips

commitはこまめに行うとよい

## コードの更新

Windowsの場合はコマンドプロンプト、macOS/Linuxの場合は端末で
```
> git pull 
```

変更がcommitされていない場合、エラーがでるので変更をcommitしておくこと

### Tips

pushしたときネット上にあるコードと自分のPCにあるコードに食い違いがあったとき、gitはmerge(変更の統合)をしようとする
その時、mergeするときに発生するcommitの名前を聞かれるが、基本的にデフォルトのままでよい
