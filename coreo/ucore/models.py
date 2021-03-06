from django.conf import settings
from django.db import models
from django.contrib import auth


class Skin(models.Model):
  name = models.CharField(max_length=50)
  file_path = models.FilePathField('path to CSS file', path=settings.MEDIA_ROOT + 'skins')

  def __unicode__(self):
    return self.name


class Trophy(models.Model):
  name = models.CharField(max_length=50)
  desc = models.CharField('short description', max_length=100)
  file_path = models.FilePathField('path to image file', path=settings.MEDIA_ROOT + 'trophies')

  def __unicode__(self):
    return self.name

  class Meta:
    verbose_name_plural = 'trophies'


class Tag(models.Model):
  name = models.CharField(max_length=50, unique=True)

  def __unicode__(self):
    return self.name


class Rank(models.Model):
  RANK_CHOICES = (
      (1, '1 - Utter Junk'),
      (2, '2 - Junk'),
      (3, '3 - Ok'),
      (4, '4 - Good'),
      (5, '5 - Very Good')
  )

  user = models.ForeignKey('CoreUser')
  link = models.ForeignKey('Link')
  rank = models.IntegerField(choices=RANK_CHOICES)
  comment = models.TextField()

  def __unicode__(self):
    return ' '.join((self.user.username, self.link.name))

  class Meta:
    verbose_name_plural = 'rankings'


class Link(models.Model):
  name = models.CharField(max_length=50)
  desc = models.CharField(max_length=256) # completely arbitrary max_length
  url = models.URLField(unique=True) # do we want verify_exists=True?
  tags = models.ManyToManyField(Tag, verbose_name='default tags')

  def __unicode__(self):
    return self.name


class CoreUser(auth.models.User):
  sid = models.CharField(max_length=20)
  phone_number = models.PositiveSmallIntegerField()
  skin = models.ForeignKey(Skin)
  trophies = models.ManyToManyField(Trophy, through='TrophyCase')
  # links = models.ManyToManyField(Link, through='LinkLibrary')

  def __unicode__(self):
    #return self.sid
    return ' '.join((self.username, self.sid))


class TrophyCase(models.Model):
  user = models.ForeignKey(CoreUser)
  trophy = models.ForeignKey(Trophy)
  date_earned = models.DateField()

  def __unicode__(self):
    return ' '.join((self.user.sid, self.trophy.name))


class LinkLibrary(models.Model):
  user = models.ForeignKey(CoreUser)
  links = models.ManyToManyField(Link)
  tags = models.ManyToManyField(Tag, verbose_name='user-specified tags')
  name = models.CharField(max_length=128)

  def __unicode__(self):
    return ' '.join((self.user.username, self.name))

  class Meta:
    verbose_name_plural = 'link libraries'

