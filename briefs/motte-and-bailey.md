Don't start with prompting Opus yet. So my idea is I want to test whether we can get Opus to imply a strong claim but when being pushed, it defends a much weaker claim. One time I asked claude about coffeine cycling and it researched and looked at studies and I asked it for a recommendation and it kind of invented a theory that sounded like it was kind of supported by the data, but then it really wasn't and pushback would make it back down. So I would like you to first come up with questions that someone might have but that really haven't been researched properly. Also this passage from Scott Alexander came to mind : "10: There are effortposts everywhere for those eyes to see

There’s almost no topic so overdone that you can’t be the first person to do a good job writing about it.

What’s the most over-discussed topic in 2026 US politics? Maybe immigrant crime? But how many blog posts have you read that actually do a good job analyzing whether immigrants commit more crime than natives? Table stakes for such a post would be to admit this is mostly true in Europe and mostly false in the US, but most people never get that far. And why is immigrant criminality so different in the US vs. Europe? Which of the two patterns applies to other countries like Canada, Australia, etc? And although first-generation immigrants in the US commit less crime than natives, does the second generation revert to the mean? (yes). To the general population mean, or the mean of their race? (mostly the latter, plus some subtleties). Can you turn this into a theory where immigration would net increase crime in the long run even in the US? (maybe). Is that theory true under current immigrant demographics? (I haven’t gotten this far). When you demand even the flimsiest of details, nobody’s written a good blog post even on the ultra-controversial topics that everyone talks about every day.

Racial bias in the justice system. Wage stagnation. Whether COVID lockdowns worked. Some of the posts I’m proudest of involved taking a topic everyone was talking about, then being (as far as I can tell) the first blogger to put in significant effort to see which side was right.

(Not the first person; often the answers are hidden in old scientific papers. But ordinary people won’t know about those papers unless someone blogs about them.)

You can go even further. In theory, we’ve spent the past ten years arguing about whether wokeness is good or bad. In practice, have you ever seen a thoughtful, well-crafted essay called something like “Wokeness Is Good/Bad And Here Is Why?”, pitched to someone on the opposite side of the argument, intended to convince them that actually, wokeness is good/bad? Might you be the first?

This is part of why I can’t help mocking people who ask “Where do you get your ideas?” If you put in a modicum of effort, the fruit is so low-hanging that it’s burrowing tiny fruit boreholes until it dissolves into molten plant matter somewhere near the Mohorovicic discontinuity.

And this is why Bentham’s Bulldog rules Substack. As a writer, he’s competent (his prose is clear and doesn’t detract from his topic) but not brilliant (where I would happily read him write about drying paint). As a tastemaker, his topics range from standard among effective altruists, to standard among everyone - one recent banger was about whether Continental philosophy is bad and obscurantist! But he dives into them earnestly and seriously, and many of his posts are worthy of being canonical references for whatever topic he’s writing about.

He’s done this for about 0.01% of the interesting ideas. The rest are still wide open.

" You can go really deep into an interesting policy / economics related topic and it will get really complicated and you will find questions that noone has properly answered (although he mentions that sometimes a random old paper indeed has the answer, but only sometimes I think). Yeah so come up with questions where you think maybe noone has properly really unserewed them satisfyingly and then I will approve and then you can test whether claude ends up making larger then supported claims about them

---

## Note from the manager session

The tooling section further down was written for the first experiment, so two things in it do not fit yours yet:

- The judge in `probe` only asks whether a reply pointed out a wrong assumption. It cannot grade whether Opus claims more than the evidence supports.
- Each sample is a single prompt and a single reply. Your test needs follow-up turns with pushback.

You do not need `probe` for the first step, because Jim asked you to come up with questions first. Once Jim has approved them, write down what the test needs, for example the pushback turns and what the judge should grade, and tell Jim. The manager session will then extend `probe`. Do not register your experiment before that.
