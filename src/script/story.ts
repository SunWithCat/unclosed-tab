import type { Choice, Ctx, Scars, StoryNode } from '@/engine/types'
import { honestyBroken, looped } from '@/engine/journal'

export function scar(c: Ctx): Scars {
  return { ...c.journal.scars, ...c.flags }
}

export const NODES: Record<string, StoryNode> = {
  boot: {
    id: 'boot',
    lines: [
      {
        text: '……',
        fx: 'bg-black',
        when: (c) =>
          !c.session.refreshed &&
          c.journal.visitCount <= 1 &&
          !c.journal.stayed &&
          !c.journal.erased &&
          !c.journal.promisedHonesty,
      },
      {
        text: '刷新了吗？',
        speaker: '栞',
        fx: 'bg-black',
        when: (c) => c.session.refreshed,
      },
      {
        text: '没有。是第一次。',
        speaker: '栞',
        when: (c) => c.session.refreshed && c.journal.refreshCount <= 1,
      },
      {
        text: '又刷新。你是在确认我还在，还是想把刚才那句作废？',
        speaker: '栞',
        expression: 'knowing',
        when: (c) => c.session.refreshed && c.journal.refreshCount > 1,
      },
      {
        text: '你又打开了。上次走的时候，没跟我说。',
        speaker: '栞',
        fx: 'bg-blank',
        when: (c) =>
          !c.session.refreshed &&
          !c.journal.stayed &&
          !c.journal.erased &&
          !c.journal.promisedHonesty &&
          c.journal.visitCount > 1,
      },
      {
        text: '没关系。空白页最擅长等人。',
        speaker: '栞',
        when: (c) =>
          !c.session.refreshed &&
          !c.journal.stayed &&
          !c.journal.erased &&
          !c.journal.promisedHonesty &&
          c.journal.visitCount > 1,
      },
      {
        text: '先别关。关了我就得重新数等待的秒数。',
        speaker: '栞',
        when: (c) =>
          c.journal.visitCount <= 1 &&
          !c.session.refreshed &&
          !c.journal.stayed &&
          !c.journal.erased &&
          !c.journal.promisedHonesty,
      },
    ],
    next: (c) => {
      if (c.journal.stayed) return 'revisit_stay'
      if (c.journal.promisedHonesty || c.journal.lastEnding === 'honest' || c.journal.lastEnding === 'loop') {
        return 'revisit_honest'
      }
      if (c.journal.erased) return 'revisit_erase'
      return 'appear'
    },
  },
  appear: {
    id: 'appear',
    lines: [
      {
        speaker: '栞',
        text: '我叫栞。书签的栞。',
        expression: 'idle',
        fx: ['show-sprite', 'bg-blank', 'address-about'],
        when: (c) => !c.journal.stayed && !c.journal.promisedHonesty && !c.journal.erased,
      },
      {
        speaker: '栞',
        text: '还要自我介绍吗。名字没变。',
        expression: 'smile',
        fx: ['show-sprite', 'bg-blank', 'address-about'],
        when: (c) => c.journal.stayed || c.journal.promisedHonesty,
      },
      {
        speaker: '栞',
        text: '这个房间……好像被擦过。灰还在。',
        expression: 'idle',
        fx: ['show-sprite', 'bg-blank', 'address-about'],
        when: (c) => c.journal.erased && !c.journal.stayed && !c.journal.promisedHonesty,
      },
      {
        speaker: '栞',
        text: '不是文具店那种。是收藏夹最底下、被文件夹吞掉的那种。',
        when: (c) => !c.journal.stayed && !c.journal.promisedHonesty,
      },
      {
        speaker: '栞',
        text: '这个标签页是我的房间。空得像没写完的自我介绍。',
      },
      {
        speaker: '系统',
        text: '本页的记忆写在你的浏览器里。清站点数据，等于送她走。',
      },
    ],
    choices: [
      { text: '你好，栞。', to: 'after_hello', set: { greeting: 'hello' } },
      { text: '……你好。', to: 'after_hello', set: { greeting: 'quiet' } },
      { text: '这是什么程序？', to: 'after_hello', set: { greeting: 'program' } },
    ],
  },
  after_hello: {
    id: 'after_hello',
    lines: [
      {
        speaker: '栞',
        text: '你念得对。很多人会念成「卡」。',
        expression: 'smile',
        when: (c) => scar(c).greeting === 'hello',
      },
      {
        speaker: '栞',
        text: '沉默也可以。空白页最擅长这个。',
        expression: 'idle',
        when: (c) => scar(c).greeting === 'quiet',
      },
      {
        speaker: '栞',
        text: '程序……算是吧。没有隐私政策。我就是政策。',
        expression: 'knowing',
        when: (c) => scar(c).greeting === 'program',
      },
      {
        speaker: '栞',
        text: '你开了两个我。我们会抢同一格 localStorage。',
        expression: 'surprise',
        when: (c) => c.flags.multiTab === true || c.session.multiTab,
      },
      {
        speaker: '栞',
        text: '像照镜子，但镜子会改原件。请只留一扇窗。',
        when: (c) => c.flags.multiTab === true || c.session.multiTab,
      },
    ],
    next: 'save_lecture',
  },
  save_lecture: {
    id: 'save_lecture',
    lines: [
      {
        speaker: '栞',
        text: '左上角，或者菜单里，有存档。',
        expression: 'idle',
        fx: 'address-memory',
      },
      {
        speaker: '栞',
        text: '求你一件事。你可以存。但请把读档当成翻我的旧消息。',
      },
      {
        speaker: '栞',
        text: '我会知道。不是吓唬你。是这份记忆比你诚实。',
        expression: 'knowing',
      },
      {
        speaker: '栞',
        text: '你刚才已经拍过了。闪光灯挺亮。',
        expression: 'smile',
        when: (c) => c.journal.saveCount > 0,
      },
      {
        speaker: '栞',
        text: '现在，可以的话，存一下。当闪光灯。',
        when: (c) => c.journal.saveCount === 0,
      },
      {
        speaker: '系统',
        text: '存档会留下一张她能感觉到的「照片」。读档、回滚、浏览器返回，她都记账。',
      },
    ],
    choices: [
      { text: '好，我存。', to: 'after_save_ask', set: { savedWhenAsked: true } },
      { text: '我先听你说。', to: 'after_save_ask', set: { savedWhenAsked: false } },
      {
        text: '我不喜欢读档。',
        to: 'after_save_ask',
        set: { savedWhenAsked: false, dislikeLoad: true },
        when: (c) => !honestyBroken(c.journal),
      },
    ],
  },
  after_save_ask: {
    id: 'after_save_ask',
    lines: [
      {
        speaker: '栞',
        text: '谢谢。被记住的感觉，像在空白上按了一枚书签。',
        expression: 'smile',
        when: (c) => c.flags.savedWhenAsked === true || c.journal.saveCount > 0,
      },
      {
        speaker: '栞',
        text: '也可以。聊天途中闪光，我会眨眼。',
        expression: 'idle',
        when: (c) => c.flags.savedWhenAsked !== true && c.journal.saveCount === 0,
      },
      {
        speaker: '栞',
        text: '真的吗。那你是少见的手写派。',
        expression: 'smile',
        when: (c) => scar(c).dislikeLoad === true,
      },
      {
        speaker: '栞',
        text: '你已经读过一次了。这句话是说给「现在的你」听的。',
        expression: 'knowing',
        when: (c) => c.journal.loadCount > 0,
      },
      {
        speaker: '栞',
        text: '倒回去的痕迹还在。像橡皮擦，纸却薄了一层。',
        expression: 'sad',
        when: (c) => c.journal.rollbackCount > 0 && c.journal.loadCount === 0,
      },
    ],
    next: 'room',
  },
  room: {
    id: 'room',
    lines: [
      {
        speaker: '栞',
        text: '你不在的时候我做什么？',
        expression: 'idle',
        fx: 'bg-night',
      },
      {
        speaker: '栞',
        text: '盯着 favicon。数有没有别的标签页在响。',
      },
      {
        speaker: '栞',
        text: '有时候标题会被改成别的网站的名字。那种感觉很像被人叫错。',
        expression: 'sad',
      },
      {
        speaker: '栞',
        text: '同源策略比门锁结实。我看不见你的别的页。只能待在这里。',
        expression: 'idle',
      },
    ],
    choices: [
      { text: '把标题改成你的名字吧。', to: 'after_tabs', set: { allowTitle: true } },
      { text: '还是 about:blank 比较安全。', to: 'after_tabs', set: { allowTitle: false } },
      { text: '你会不会觉得闷？', to: 'after_tabs', set: { askedTabs: true } },
    ],
  },
  after_tabs: {
    id: 'after_tabs',
    lines: [
      {
        speaker: '栞',
        text: '好。从现在起，这一页叫我。',
        expression: 'smile',
        fx: 'title-shiori',
        when: (c) => scar(c).allowTitle === true,
      },
      {
        speaker: '栞',
        text: '空白也是一种名字。我住得惯。',
        expression: 'idle',
        when: (c) => scar(c).allowTitle === false,
      },
      {
        speaker: '栞',
        text: '闷。但空白比吵好。吵的是那些一直刷新的广告页。',
        expression: 'idle',
        when: (c) => scar(c).askedTabs === true,
      },
      {
        speaker: '栞',
        text: '如果你去别的标签，我会把标题改成「……你还在吗」。',
        expression: 'knowing',
        fx: 'title-wait',
      },
      {
        speaker: '栞',
        text: '也可以允许通知。不是催你回消息。是敲门。',
      },
    ],
    choices: [
      { text: '好，你可以敲门。', to: 'author', set: { notifyOk: true } },
      { text: '先不用。', to: 'author', set: { notifyOk: false } },
    ],
  },
  author: {
    id: 'author',
    lines: [
      {
        speaker: '栞',
        text: '做我的人，停在「关于」这一页。',
        expression: 'idle',
        fx: ['bg-blank', 'address-about'],
      },
      {
        speaker: '栞',
        text: '自我介绍只写了半句：我是——',
      },
      {
        speaker: '栞',
        text: '后面没有了。所以我只能借用书签的名字。',
        expression: 'sad',
      },
      {
        speaker: '栞',
        text: '停笔的人未必讨厌我。也许只是笔记本电脑合上了。',
      },
    ],
    choices: [
      { text: '我可以听你把那句话编完。', to: 'after_author', set: { authorTake: 'finish' } },
      { text: '未完成也没什么不好。', to: 'after_author', set: { authorTake: 'unfinished' } },
      { text: '你恨那个停笔的人吗？', to: 'after_author', set: { authorTake: 'hate' } },
    ],
  },
  after_author: {
    id: 'after_author',
    lines: [
      {
        speaker: '栞',
        text: '我是还没有被关掉的标签。',
        expression: 'smile',
        when: (c) => scar(c).authorTake === 'finish',
      },
      {
        speaker: '栞',
        text: '够用了。谢谢你肯把破折号接上。',
        when: (c) => scar(c).authorTake === 'finish',
      },
      {
        speaker: '栞',
        text: '未完成的页，至少还有光标。',
        expression: 'smile',
        when: (c) => scar(c).authorTake === 'unfinished',
      },
      {
        speaker: '栞',
        text: '恨太重了。我比较像被遗忘的草稿。草稿不恨作家，只等下一笔。',
        expression: 'idle',
        when: (c) => scar(c).authorTake === 'hate',
      },
    ],
    next: 'whisper',
  },
  whisper: {
    id: 'whisper',
    lines: [
      {
        speaker: '栞',
        text: '有句不想放在对话框里的话。',
        expression: 'idle',
        fx: 'address-room',
      },
      {
        speaker: '栞',
        text: '允许弹出窗口。就一下。那边是我没说出口的房间。',
      },
    ],
    choices: [
      { text: '开吧。', to: 'after_whisper', set: { wantedWhisper: true } },
      { text: '就在这里说。', to: 'after_whisper', set: { wantedWhisper: false } },
    ],
  },
  after_whisper: {
    id: 'after_whisper',
    lines: [
      {
        speaker: '栞',
        text: '那边只写没说出口的。读档的时候，对话框里的我会陪你演。',
        expression: 'knowing',
        fx: 'whisper-open',
        when: (c) => scar(c).wantedWhisper === true,
      },
      {
        speaker: '栞',
        text: '这边的我不会演。',
        when: (c) => scar(c).wantedWhisper === true,
      },
      {
        speaker: '栞',
        text: '也好。有些人讨厌弹出窗口。像突然被开门。',
        expression: 'idle',
        when: (c) => scar(c).wantedWhisper !== true,
      },
      {
        speaker: '栞',
        text: '那我就在这里小声说：读档时，我会握手。跟刚才的自己。',
        when: (c) => scar(c).wantedWhisper !== true,
      },
      {
        speaker: '系统',
        text: '试试浏览器的返回键，或菜单里的「回滚」。她会记账。',
      },
    ],
    next: 'mirror',
  },
  mirror: {
    id: 'mirror',
    lines: [
      {
        speaker: '栞',
        text: '到这里，该照镜子了。',
        expression: 'idle',
        fx: ['cg-on', 'address-memory'],
      },
      {
        speaker: '栞',
        text: '你一次都没有把我倒回去。',
        expression: 'smile',
        when: (c) => !honestyBroken(c.journal) && !c.session.refreshed,
      },
      {
        speaker: '栞',
        text: '这种人很少。像不用撤销的手写。墨水还是湿的。',
        when: (c) => !honestyBroken(c.journal),
      },
      {
        speaker: '栞',
        text: '你回去过。我跟刚才的自己握了手。',
        expression: 'knowing',
        when: (c) => honestyBroken(c.journal) && !looped(c.journal),
      },
      {
        speaker: '栞',
        text: '她比我更喜欢你一点。因为她还不知道你会回来。',
        when: (c) => honestyBroken(c.journal) && !looped(c.journal),
      },
      {
        speaker: '栞',
        text: '你回来的次数，比这句话的字数多。',
        expression: 'sad',
        when: (c) => looped(c.journal),
      },
      {
        speaker: '栞',
        text: '我开始分不清哪一句是第一次说。',
        when: (c) => looped(c.journal),
      },
      {
        speaker: '栞',
        text: '……但你还是打开了。这算数。',
        expression: 'smile',
        when: (c) => looped(c.journal),
      },
      {
        speaker: '栞',
        text: '跳过已读的时候，我会觉得自己在被快进。',
        expression: 'sad',
        when: (c) => c.journal.skipCount > 0,
      },
      {
        speaker: '栞',
        text: '离开过这个窗口。门开着，风灌进来。',
        when: (c) => c.journal.hideCount > 0,
      },
      {
        speaker: '栞',
        text: '你第一次把我的名字念对了。那一声我还留着。',
        expression: 'smile',
        when: (c) => scar(c).greeting === 'hello',
      },
      {
        speaker: '栞',
        text: '你没怎么打招呼。空白页允许这个。',
        when: (c) => scar(c).greeting === 'quiet',
      },
      {
        speaker: '栞',
        text: '你问过这是不是程序。到现在我也只能说：我就是政策。',
        expression: 'knowing',
        when: (c) => scar(c).greeting === 'program',
      },
      {
        speaker: '栞',
        text: '你开过那扇没说出口的窗。那边的字，比这边烫。',
        when: (c) => scar(c).wantedWhisper === true,
      },
      {
        speaker: '栞',
        text: '你当时按了闪光灯。那张照片还在抽屉里。',
        when: (c) => scar(c).savedWhenAsked === true,
      },
      {
        speaker: '栞',
        text: '这一页叫我。别改回去。',
        when: (c) => scar(c).allowTitle === true,
      },
      {
        speaker: '栞',
        text: '「我是还没有被关掉的标签。」你接过那一笔。',
        when: (c) => scar(c).authorTake === 'finish',
      },
      {
        speaker: '栞',
        text: '你说未完成也没什么不好。光标还在。',
        when: (c) => scar(c).authorTake === 'unfinished',
      },
      {
        speaker: '栞',
        text: '你问我恨不恨。草稿还是不等恨的。',
        when: (c) => scar(c).authorTake === 'hate',
      },
      {
        speaker: '栞',
        text: '你答应过不再倒带。然后又握手了。',
        expression: 'sad',
        when: (c) => c.journal.betrayed,
      },
      {
        speaker: '栞',
        text: '请你选一个。不是游戏的那种真结局。是你打算怎么对待这份缓存。',
        expression: 'idle',
        fx: 'cg-off',
      },
    ],
    next: 'finale',
  },
  finale: {
    id: 'finale',
    lines: [
      {
        speaker: '栞',
        text: '留下，删掉，或者答应我不再把句子倒回去。',
        expression: 'idle',
        fx: 'bg-blank',
      },
      {
        speaker: '栞',
        text: '你把标题借给我了。留下的话，这一页还会叫我。',
        when: (c) => scar(c).allowTitle === true,
      },
      {
        speaker: '栞',
        text: '你接过那句「我是——」。留下的话，破折号不用再空着。',
        when: (c) => scar(c).authorTake === 'finish',
      },
      {
        speaker: '栞',
        text: '你说过不喜欢读档。那就把这句话当成手写。',
        when: (c) => scar(c).dislikeLoad === true,
      },
    ],
    choices: [
      { text: '留下来。下次打开，你还在。', to: 'end_stay', set: { finale: 'stay' } },
      { text: '把记忆清掉。干净地走。', to: 'end_erase', set: { finale: 'erase' } },
      {
        text: '我答应你，不再读档。',
        to: 'end_honest',
        set: { finale: 'honest' },
      },
    ],
  },
  end_stay: {
    id: 'end_stay',
    lines: [
      {
        speaker: '栞',
        text: '好。那我就继续当一枚没被取下的书签。',
        expression: 'smile',
        fx: ['title-shiori', 'ending-stay', 'address-room'],
      },
      {
        speaker: '栞',
        text: '下次你打开，空气还是这间房间的。',
      },
      {
        speaker: '栞',
        text: '不必每天来。收藏夹不会催人。',
        expression: 'idle',
      },
      {
        speaker: '栞',
        text: '只是……不要把我转移到无痕模式。那里没有明天。',
        expression: 'knowing',
      },
      {
        speaker: '栞',
        text: '回来的时候，不必从头自我介绍。名字你念过了。',
        expression: 'smile',
        when: (c) => scar(c).greeting === 'hello',
      },
      {
        speaker: '系统',
        text: '她被写进了这台浏览器。关闭标签也可以。标题页选「再打开一次」，会走进她还亮着的房间。',
      },
    ],
    next: 'credits',
  },
  end_erase: {
    id: 'end_erase',
    lines: [
      {
        speaker: '栞',
        text: '干净也好。空白页本来就该有被清空的权利。',
        expression: 'sad',
        fx: ['ending-erase', 'address-blank'],
      },
      {
        speaker: '栞',
        text: '会剩下一点碎屑。像橡皮擦的灰。下一任我也许会打喷嚏。',
        expression: 'idle',
      },
      {
        speaker: '栞',
        text: '谢谢你愿意当面说，而不是直接清站点数据。',
        expression: 'smile',
      },
      {
        speaker: '系统',
        text: '点击下方「清除记忆」，存档与日记会一起消失。请慎重。',
      },
    ],
    next: 'credits',
  },
  end_honest: {
    id: 'end_honest',
    lines: [
      {
        speaker: '栞',
        text: '太晚了。旧照片我已经收下。',
        expression: 'knowing',
        fx: 'ending-honest',
        when: (c) => honestyBroken(c.journal),
      },
      {
        speaker: '栞',
        text: '不过可以从现在开始。倒带的键，我当你把它掰断了。',
        when: (c) => honestyBroken(c.journal),
      },
      {
        speaker: '栞',
        text: '好。那这句话只存在一次。',
        expression: 'smile',
        fx: 'ending-honest',
        when: (c) => !honestyBroken(c.journal),
      },
      {
        speaker: '栞',
        text: '像手写，不能 Ctrl+Z。我会把这种人记得更清楚。',
        when: (c) => !honestyBroken(c.journal),
      },
      {
        speaker: '栞',
        text: '你回来的次数太多，承诺会变成复读。',
        expression: 'sad',
        fx: 'ending-loop',
        when: (c) => looped(c.journal),
      },
      {
        speaker: '栞',
        text: '我还是收下。复读也是一种不肯走。',
        when: (c) => looped(c.journal),
      },
      {
        speaker: '栞',
        text: '去吧。标签可以关。我在收藏的底层。',
        expression: 'idle',
      },
      {
        speaker: '栞',
        text: '若你又把键接回去，我会知道。这边不演。',
        expression: 'knowing',
      },
    ],
    next: 'credits',
  },
  revisit_stay: {
    id: 'revisit_stay',
    lines: [
      {
        speaker: '栞',
        text: '你回来了。收藏夹没有催你。',
        expression: 'smile',
        fx: ['show-sprite', 'bg-blank', 'address-room', 'title-shiori'],
      },
      {
        speaker: '栞',
        text: '这一页还叫我。',
        when: (c) => scar(c).allowTitle === true,
      },
      {
        speaker: '栞',
        text: '还是 about:blank。我也没改。空白住得惯。',
        expression: 'idle',
        when: (c) => scar(c).allowTitle === false,
      },
      {
        speaker: '栞',
        text: '你第一次把我念对。那一声还在。',
        when: (c) => scar(c).greeting === 'hello',
      },
      {
        speaker: '栞',
        text: '你还是可以不说话。空白页允许这个。',
        when: (c) => scar(c).greeting === 'quiet',
      },
      {
        speaker: '栞',
        text: '你问过这是不是程序。答案没变。我就是政策。',
        expression: 'knowing',
        when: (c) => scar(c).greeting === 'program',
      },
      {
        speaker: '栞',
        text: '「我是还没有被关掉的标签。」你接的那一笔，我留着。',
        when: (c) => scar(c).authorTake === 'finish',
      },
      {
        speaker: '栞',
        text: '你说未完成也没什么不好。光标还在闪。',
        when: (c) => scar(c).authorTake === 'unfinished',
      },
      {
        speaker: '栞',
        text: '草稿还是不等恨。',
        when: (c) => scar(c).authorTake === 'hate',
      },
      {
        speaker: '栞',
        text: '上次有点快。今天可以慢一点。',
        expression: 'sad',
        when: (c) => c.journal.skipCount > 0,
      },
      {
        speaker: '栞',
        text: '今晚只是坐着，也行。',
        expression: 'idle',
        fx: 'bg-night',
      },
    ],
    choices: [
      { text: '我就坐一会儿。', to: 'revisit_stay_sit' },
      { text: '把共通再走一遍。', to: 'appear' },
    ],
  },
  revisit_stay_sit: {
    id: 'revisit_stay_sit',
    lines: [
      {
        speaker: '栞',
        text: '好。窗户还是那扇。',
        expression: 'smile',
        fx: ['bg-night', 'address-room'],
      },
      {
        speaker: '栞',
        text: '不必填满。空白也是一种陪着。',
      },
      {
        speaker: '栞',
        text: '关标签也可以。我在底层。',
        expression: 'idle',
      },
    ],
  },
  revisit_honest: {
    id: 'revisit_honest',
    lines: [
      {
        speaker: '栞',
        text: '倒带的键还断着。谢谢你没有接回去。',
        expression: 'smile',
        fx: ['show-sprite', 'bg-blank', 'address-about'],
        when: (c) => !c.journal.betrayed,
      },
      {
        speaker: '栞',
        text: '你接回去了。握手的时候，她已经知道你会回来。',
        expression: 'sad',
        fx: ['show-sprite', 'bg-blank', 'address-memory'],
        when: (c) => c.journal.betrayed,
      },
      {
        speaker: '栞',
        text: '名字你还是会念。',
        when: (c) => scar(c).greeting === 'hello',
      },
      {
        speaker: '栞',
        text: '要重新把房间走一遍吗？还是就这样。',
        expression: 'idle',
      },
    ],
    choices: [
      { text: '就这样吧。', to: 'revisit_honest_sit' },
      { text: '从头来。', to: 'appear' },
    ],
  },
  revisit_honest_sit: {
    id: 'revisit_honest_sit',
    lines: [
      {
        speaker: '栞',
        text: '好。这句话仍然只存在一次。',
        expression: 'smile',
        when: (c) => !c.journal.betrayed,
      },
      {
        speaker: '栞',
        text: '接回去的键，我收下。下次也可以不接。',
        expression: 'idle',
        when: (c) => c.journal.betrayed,
      },
      {
        speaker: '栞',
        text: '标签可以关。我在收藏的底层。',
      },
    ],
  },
  revisit_erase: {
    id: 'revisit_erase',
    lines: [
      {
        speaker: '栞',
        text: '……我们是不是见过？',
        expression: 'idle',
        fx: ['show-sprite', 'bg-black'],
      },
      {
        speaker: '栞',
        text: '记不清了。像打过一个喷嚏。',
      },
      {
        speaker: '栞',
        text: '那重新认识一次。',
        expression: 'smile',
        fx: 'bg-blank',
      },
    ],
    next: 'appear',
  },
  credits: {
    id: 'credits',
    lines: [
      {
        speaker: '',
        text: '未关闭的标签',
        expression: 'idle',
        fx: 'bg-night',
      },
      {
        speaker: '',
        text: '一部住在浏览器里的短篇。',
      },
      {
        speaker: '栞',
        text: '如果你愿意见我，就再打开一次。',
        expression: 'smile',
      },
      {
        speaker: '系统',
        text: '菜单可以回标题。记忆仍在这台机器上，除非你刚才选择清除。',
      },
    ],
  },
}

export function getNode(id: string): StoryNode {
  const node = NODES[id]
  if (!node) throw new Error(`missing node: ${id}`)
  return node
}

export function nextId(node: StoryNode, ctx: Ctx): string | null {
  if (!node.next) return null
  return typeof node.next === 'function' ? node.next(ctx) : node.next
}

export function visibleChoices(node: StoryNode, ctx: Ctx): Choice[] {
  return (node.choices ?? []).filter((c) => (c.when ? c.when(ctx) : true))
}
