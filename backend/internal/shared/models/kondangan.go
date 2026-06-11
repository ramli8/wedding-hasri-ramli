package models

import "time"

// KondanganRelation represents the relation category for kondangan
type KondanganRelation struct {
	ID        int       `gorm:"primaryKey;autoIncrement"`
	Name      string    `gorm:"type:varchar(100);not null;uniqueIndex"`
	CreatedAt time.Time `gorm:"not null;default:now()"`
	UpdatedAt time.Time `gorm:"not null;default:now()"`
}

func (KondanganRelation) TableName() string {
	return "kondangan_relations"
}

// Kondangan represents a kondangan record
type Kondangan struct {
	ID         string            `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	CoupleName string            `gorm:"type:varchar(255);not null"`
	RelationID int               `gorm:"not null"`
	Relation   KondanganRelation `gorm:"foreignKey:RelationID"`
	Side       string            `gorm:"type:varchar(50);not null"`
	GiftType   string            `gorm:"type:varchar(50);not null"`
	GiftName   *string           `gorm:"type:varchar(255);default:null"`
	Nominal    *float64          `gorm:"type:decimal(15,2);default:null"`
	CreatedAt  time.Time         `gorm:"not null;default:now()"`
	UpdatedAt  time.Time         `gorm:"not null;default:now()"`
	DeletedAt  *time.Time        `gorm:"index"`
}

func (Kondangan) TableName() string {
	return "kondangans"
}
