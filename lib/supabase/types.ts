export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string
          display_name: string
          email: string
          is_active: boolean
          role: Database["public"]["Enums"]["admin_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name: string
          email: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["admin_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          email?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["admin_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      article_categories: {
        Row: {
          id: string
          name: string
          slug: string
          sort_order: number
          type: Database["public"]["Enums"]["article_type"]
        }
        Insert: {
          id?: string
          name: string
          slug: string
          sort_order?: number
          type: Database["public"]["Enums"]["article_type"]
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          type?: Database["public"]["Enums"]["article_type"]
        }
        Relationships: []
      }
      article_products: {
        Row: {
          article_id: string
          product_id: string
          sort_order: number
        }
        Insert: {
          article_id: string
          product_id: string
          sort_order?: number
        }
        Update: {
          article_id?: string
          product_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "article_products_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_products_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "v_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_products"
            referencedColumns: ["id"]
          },
        ]
      }
      article_related: {
        Row: {
          article_id: string
          related_article_id: string
          sort_order: number
        }
        Insert: {
          article_id: string
          related_article_id: string
          sort_order?: number
        }
        Update: {
          article_id?: string
          related_article_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "article_related_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_related_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "v_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_related_related_article_id_fkey"
            columns: ["related_article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_related_related_article_id_fkey"
            columns: ["related_article_id"]
            isOneToOne: false
            referencedRelation: "v_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      article_solutions: {
        Row: {
          article_id: string
          solution_id: string
        }
        Insert: {
          article_id: string
          solution_id: string
        }
        Update: {
          article_id?: string
          solution_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_solutions_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_solutions_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "v_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_solutions_solution_id_fkey"
            columns: ["solution_id"]
            isOneToOne: false
            referencedRelation: "solutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_solutions_solution_id_fkey"
            columns: ["solution_id"]
            isOneToOne: false
            referencedRelation: "v_solutions"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          author_id: string
          body: Json
          category_id: string | null
          cover_media_id: string | null
          created_at: string
          excerpt: string
          id: string
          is_featured: boolean
          level: Database["public"]["Enums"]["learn_level"] | null
          published_at: string | null
          reading_time: number | null
          scheduled_at: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: Database["public"]["Enums"]["pub_status"]
          tags: string[]
          title: string
          type: Database["public"]["Enums"]["article_type"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          author_id: string
          body: Json
          category_id?: string | null
          cover_media_id?: string | null
          created_at?: string
          excerpt: string
          id?: string
          is_featured?: boolean
          level?: Database["public"]["Enums"]["learn_level"] | null
          published_at?: string | null
          reading_time?: number | null
          scheduled_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: Database["public"]["Enums"]["pub_status"]
          tags?: string[]
          title: string
          type: Database["public"]["Enums"]["article_type"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          author_id?: string
          body?: Json
          category_id?: string | null
          cover_media_id?: string | null
          created_at?: string
          excerpt?: string
          id?: string
          is_featured?: boolean
          level?: Database["public"]["Enums"]["learn_level"] | null
          published_at?: string | null
          reading_time?: number | null
          scheduled_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["pub_status"]
          tags?: string[]
          title?: string
          type?: Database["public"]["Enums"]["article_type"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "articles_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "authors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "v_authors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "article_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "v_article_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_cover_media_id_fkey"
            columns: ["cover_media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_cover_media_id_fkey"
            columns: ["cover_media_id"]
            isOneToOne: false
            referencedRelation: "v_media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_cover_media_id_fkey"
            columns: ["cover_media_id"]
            isOneToOne: false
            referencedRelation: "v_product_images"
            referencedColumns: ["media_id"]
          },
          {
            foreignKeyName: "articles_cover_media_id_fkey"
            columns: ["cover_media_id"]
            isOneToOne: false
            referencedRelation: "v_project_images"
            referencedColumns: ["media_id"]
          },
          {
            foreignKeyName: "articles_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      authors: {
        Row: {
          created_at: string
          id: string
          name: string
          photo_media_id: string | null
          role: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          photo_media_id?: string | null
          role?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          photo_media_id?: string | null
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "authors_photo_media_id_fkey"
            columns: ["photo_media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "authors_photo_media_id_fkey"
            columns: ["photo_media_id"]
            isOneToOne: false
            referencedRelation: "v_media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "authors_photo_media_id_fkey"
            columns: ["photo_media_id"]
            isOneToOne: false
            referencedRelation: "v_product_images"
            referencedColumns: ["media_id"]
          },
          {
            foreignKeyName: "authors_photo_media_id_fkey"
            columns: ["photo_media_id"]
            isOneToOne: false
            referencedRelation: "v_project_images"
            referencedColumns: ["media_id"]
          },
        ]
      }
      brands: {
        Row: {
          created_at: string
          id: string
          is_authorized_dealer: boolean
          logo_media_id: string | null
          name: string
          slug: string
          updated_at: string
          website: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_authorized_dealer?: boolean
          logo_media_id?: string | null
          name: string
          slug: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_authorized_dealer?: boolean
          logo_media_id?: string | null
          name?: string
          slug?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brands_logo_media_id_fkey"
            columns: ["logo_media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brands_logo_media_id_fkey"
            columns: ["logo_media_id"]
            isOneToOne: false
            referencedRelation: "v_media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brands_logo_media_id_fkey"
            columns: ["logo_media_id"]
            isOneToOne: false
            referencedRelation: "v_product_images"
            referencedColumns: ["media_id"]
          },
          {
            foreignKeyName: "brands_logo_media_id_fkey"
            columns: ["logo_media_id"]
            isOneToOne: false
            referencedRelation: "v_project_images"
            referencedColumns: ["media_id"]
          },
        ]
      }
      lead_throttle: {
        Row: {
          count: number
          ip_hash: string
          window_start: string
        }
        Insert: {
          count?: number
          ip_hash: string
          window_start?: string
        }
        Update: {
          count?: number
          ip_hash?: string
          window_start?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          company: string | null
          created_at: string
          email: string | null
          form_type: Database["public"]["Enums"]["lead_form_type"]
          forward_error: string | null
          forwarded_ok: boolean
          id: string
          message: string | null
          name: string
          page_url: string
          phone: string | null
          product_slug: string | null
          solution_slug: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string
          email?: string | null
          form_type: Database["public"]["Enums"]["lead_form_type"]
          forward_error?: string | null
          forwarded_ok?: boolean
          id?: string
          message?: string | null
          name: string
          page_url: string
          phone?: string | null
          product_slug?: string | null
          solution_slug?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string | null
          form_type?: Database["public"]["Enums"]["lead_form_type"]
          forward_error?: string | null
          forwarded_ok?: boolean
          id?: string
          message?: string | null
          name?: string
          page_url?: string
          phone?: string | null
          product_slug?: string | null
          solution_slug?: string | null
        }
        Relationships: []
      }
      media: {
        Row: {
          alt: string | null
          caption: string | null
          created_at: string
          created_by: string | null
          external_url: string | null
          height: number | null
          id: string
          is_placeholder: boolean
          kind: Database["public"]["Enums"]["media_kind"]
          source_license: string | null
          storage_path: string | null
          width: number | null
        }
        Insert: {
          alt?: string | null
          caption?: string | null
          created_at?: string
          created_by?: string | null
          external_url?: string | null
          height?: number | null
          id?: string
          is_placeholder?: boolean
          kind: Database["public"]["Enums"]["media_kind"]
          source_license?: string | null
          storage_path?: string | null
          width?: number | null
        }
        Update: {
          alt?: string | null
          caption?: string | null
          created_at?: string
          created_by?: string | null
          external_url?: string | null
          height?: number | null
          id?: string
          is_placeholder?: boolean
          kind?: Database["public"]["Enums"]["media_kind"]
          source_license?: string | null
          storage_path?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "media_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          source_path: string | null
          unsubscribed_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          source_path?: string | null
          unsubscribed_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          source_path?: string | null
          unsubscribed_at?: string | null
        }
        Relationships: []
      }
      page_sections: {
        Row: {
          content: Json
          id: string
          is_enabled: boolean
          page_key: string
          section_key: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content?: Json
          id?: string
          is_enabled?: boolean
          page_key: string
          section_key: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content?: Json
          id?: string
          is_enabled?: boolean
          page_key?: string
          section_key?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "page_sections_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      product_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      product_images: {
        Row: {
          id: string
          image_annotation: string | null
          media_id: string
          product_id: string
          sort_order: number
        }
        Insert: {
          id?: string
          image_annotation?: string | null
          media_id: string
          product_id: string
          sort_order?: number
        }
        Update: {
          id?: string
          image_annotation?: string | null
          media_id?: string
          product_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_images_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_images_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "v_media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_images_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "v_product_images"
            referencedColumns: ["media_id"]
          },
          {
            foreignKeyName: "product_images_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "v_project_images"
            referencedColumns: ["media_id"]
          },
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_similar: {
        Row: {
          product_id: string
          similar_product_id: string
          sort_order: number
        }
        Insert: {
          product_id: string
          similar_product_id: string
          sort_order?: number
        }
        Update: {
          product_id?: string
          similar_product_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_similar_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_similar_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_similar_similar_product_id_fkey"
            columns: ["similar_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_similar_similar_product_id_fkey"
            columns: ["similar_product_id"]
            isOneToOne: false
            referencedRelation: "v_products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_solutions: {
        Row: {
          product_id: string
          solution_id: string
          sort_order: number
        }
        Insert: {
          product_id: string
          solution_id: string
          sort_order?: number
        }
        Update: {
          product_id?: string
          solution_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_solutions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_solutions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_solutions_solution_id_fkey"
            columns: ["solution_id"]
            isOneToOne: false
            referencedRelation: "solutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_solutions_solution_id_fkey"
            columns: ["solution_id"]
            isOneToOne: false
            referencedRelation: "v_solutions"
            referencedColumns: ["id"]
          },
        ]
      }
      product_spec_values: {
        Row: {
          id: string
          product_id: string
          spec_definition_id: string
          value_boolean: boolean | null
          value_number: number | null
          value_options: string[] | null
          value_text: string
        }
        Insert: {
          id?: string
          product_id: string
          spec_definition_id: string
          value_boolean?: boolean | null
          value_number?: number | null
          value_options?: string[] | null
          value_text: string
        }
        Update: {
          id?: string
          product_id?: string
          spec_definition_id?: string
          value_boolean?: boolean | null
          value_number?: number | null
          value_options?: string[] | null
          value_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_spec_values_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_spec_values_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_spec_values_spec_definition_id_fkey"
            columns: ["spec_definition_id"]
            isOneToOne: false
            referencedRelation: "spec_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_spec_values_spec_definition_id_fkey"
            columns: ["spec_definition_id"]
            isOneToOne: false
            referencedRelation: "v_spec_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      product_types: {
        Row: {
          category_id: string
          created_at: string
          id: string
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_types_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_types_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "v_product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          brand_id: string
          category_id: string
          created_at: string
          description_md: string | null
          id: string
          internal_price: number | null
          is_featured: boolean
          name: string
          product_type_id: string | null
          seo_description: string | null
          seo_title: string | null
          short_spec: string
          slug: string
          spec_source_url: string | null
          status: Database["public"]["Enums"]["pub_status"]
          suitable_for: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          brand_id: string
          category_id: string
          created_at?: string
          description_md?: string | null
          id?: string
          internal_price?: number | null
          is_featured?: boolean
          name: string
          product_type_id?: string | null
          seo_description?: string | null
          seo_title?: string | null
          short_spec: string
          slug: string
          spec_source_url?: string | null
          status?: Database["public"]["Enums"]["pub_status"]
          suitable_for?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          brand_id?: string
          category_id?: string
          created_at?: string
          description_md?: string | null
          id?: string
          internal_price?: number | null
          is_featured?: boolean
          name?: string
          product_type_id?: string | null
          seo_description?: string | null
          seo_title?: string | null
          short_spec?: string
          slug?: string
          spec_source_url?: string | null
          status?: Database["public"]["Enums"]["pub_status"]
          suitable_for?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "v_brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "v_product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_product_type_id_fkey"
            columns: ["product_type_id"]
            isOneToOne: false
            referencedRelation: "product_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_product_type_id_fkey"
            columns: ["product_type_id"]
            isOneToOne: false
            referencedRelation: "v_product_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      project_images: {
        Row: {
          id: string
          media_id: string
          project_id: string
          sort_order: number
        }
        Insert: {
          id?: string
          media_id: string
          project_id: string
          sort_order?: number
        }
        Update: {
          id?: string
          media_id?: string
          project_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_images_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_images_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "v_media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_images_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "v_product_images"
            referencedColumns: ["media_id"]
          },
          {
            foreignKeyName: "project_images_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "v_project_images"
            referencedColumns: ["media_id"]
          },
          {
            foreignKeyName: "project_images_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_images_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_products: {
        Row: {
          product_id: string
          project_id: string
        }
        Insert: {
          product_id: string
          project_id: string
        }
        Update: {
          product_id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_products_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_products_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_solutions: {
        Row: {
          project_id: string
          solution_id: string
        }
        Insert: {
          project_id: string
          solution_id: string
        }
        Update: {
          project_id?: string
          solution_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_solutions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_solutions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_solutions_solution_id_fkey"
            columns: ["solution_id"]
            isOneToOne: false
            referencedRelation: "solutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_solutions_solution_id_fkey"
            columns: ["solution_id"]
            isOneToOne: false
            referencedRelation: "v_solutions"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          client_name_internal: string | null
          cover_media_id: string | null
          created_at: string
          id: string
          location_label: string | null
          public_label: string
          scope_chips: string[]
          scope_description: string | null
          slug: string
          sort_order: number
          status: Database["public"]["Enums"]["pub_status"]
          updated_at: string
          updated_by: string | null
          value_idr: number | null
          year: number | null
        }
        Insert: {
          client_name_internal?: string | null
          cover_media_id?: string | null
          created_at?: string
          id?: string
          location_label?: string | null
          public_label: string
          scope_chips?: string[]
          scope_description?: string | null
          slug: string
          sort_order?: number
          status?: Database["public"]["Enums"]["pub_status"]
          updated_at?: string
          updated_by?: string | null
          value_idr?: number | null
          year?: number | null
        }
        Update: {
          client_name_internal?: string | null
          cover_media_id?: string | null
          created_at?: string
          id?: string
          location_label?: string | null
          public_label?: string
          scope_chips?: string[]
          scope_description?: string | null
          slug?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["pub_status"]
          updated_at?: string
          updated_by?: string | null
          value_idr?: number | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_cover_media_id_fkey"
            columns: ["cover_media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_cover_media_id_fkey"
            columns: ["cover_media_id"]
            isOneToOne: false
            referencedRelation: "v_media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_cover_media_id_fkey"
            columns: ["cover_media_id"]
            isOneToOne: false
            referencedRelation: "v_product_images"
            referencedColumns: ["media_id"]
          },
          {
            foreignKeyName: "projects_cover_media_id_fkey"
            columns: ["cover_media_id"]
            isOneToOne: false
            referencedRelation: "v_project_images"
            referencedColumns: ["media_id"]
          },
          {
            foreignKeyName: "projects_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      redirects: {
        Row: {
          created_at: string
          destination_path: string
          id: string
          source_path: string
        }
        Insert: {
          created_at?: string
          destination_path: string
          id?: string
          source_path: string
        }
        Update: {
          created_at?: string
          destination_path?: string
          id?: string
          source_path?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          address: string | null
          business_hours: Json | null
          city: string | null
          claim_verified: boolean
          email: string
          featured_product_id: string | null
          footer_description: string | null
          id: number
          instagram: string | null
          response_claim: string | null
          seo_default_description: string | null
          seo_default_title: string | null
          tagline: string | null
          updated_at: string
          updated_by: string | null
          whatsapp_number: string
        }
        Insert: {
          address?: string | null
          business_hours?: Json | null
          city?: string | null
          claim_verified?: boolean
          email: string
          featured_product_id?: string | null
          footer_description?: string | null
          id?: number
          instagram?: string | null
          response_claim?: string | null
          seo_default_description?: string | null
          seo_default_title?: string | null
          tagline?: string | null
          updated_at?: string
          updated_by?: string | null
          whatsapp_number: string
        }
        Update: {
          address?: string | null
          business_hours?: Json | null
          city?: string | null
          claim_verified?: boolean
          email?: string
          featured_product_id?: string | null
          footer_description?: string | null
          id?: number
          instagram?: string | null
          response_claim?: string | null
          seo_default_description?: string | null
          seo_default_title?: string | null
          tagline?: string | null
          updated_at?: string
          updated_by?: string | null
          whatsapp_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_settings_featured_product_id_fkey"
            columns: ["featured_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_settings_featured_product_id_fkey"
            columns: ["featured_product_id"]
            isOneToOne: false
            referencedRelation: "v_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      solution_sections: {
        Row: {
          body: string | null
          heading: string | null
          id: string
          items: Json
          solution_id: string
          sort_order: number
          type: Database["public"]["Enums"]["solution_section_type"]
        }
        Insert: {
          body?: string | null
          heading?: string | null
          id?: string
          items?: Json
          solution_id: string
          sort_order?: number
          type: Database["public"]["Enums"]["solution_section_type"]
        }
        Update: {
          body?: string | null
          heading?: string | null
          id?: string
          items?: Json
          solution_id?: string
          sort_order?: number
          type?: Database["public"]["Enums"]["solution_section_type"]
        }
        Relationships: [
          {
            foreignKeyName: "solution_sections_solution_id_fkey"
            columns: ["solution_id"]
            isOneToOne: false
            referencedRelation: "solutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solution_sections_solution_id_fkey"
            columns: ["solution_id"]
            isOneToOne: false
            referencedRelation: "v_solutions"
            referencedColumns: ["id"]
          },
        ]
      }
      solutions: {
        Row: {
          created_at: string
          hero_annotations: Json
          hero_headline: string | null
          hero_media_id: string | null
          hero_subcopy: string | null
          id: string
          name: string
          related_category_slugs: string[]
          seo_description: string | null
          seo_title: string | null
          signal_chain: Json
          slug: string
          sort_order: number
          status: Database["public"]["Enums"]["pub_status"]
          tags: string[]
          tier: Database["public"]["Enums"]["solution_tier"]
          updated_at: string
          updated_by: string | null
          value_prop: string
          wa_message: string | null
        }
        Insert: {
          created_at?: string
          hero_annotations?: Json
          hero_headline?: string | null
          hero_media_id?: string | null
          hero_subcopy?: string | null
          id?: string
          name: string
          related_category_slugs?: string[]
          seo_description?: string | null
          seo_title?: string | null
          signal_chain?: Json
          slug: string
          sort_order?: number
          status?: Database["public"]["Enums"]["pub_status"]
          tags?: string[]
          tier: Database["public"]["Enums"]["solution_tier"]
          updated_at?: string
          updated_by?: string | null
          value_prop: string
          wa_message?: string | null
        }
        Update: {
          created_at?: string
          hero_annotations?: Json
          hero_headline?: string | null
          hero_media_id?: string | null
          hero_subcopy?: string | null
          id?: string
          name?: string
          related_category_slugs?: string[]
          seo_description?: string | null
          seo_title?: string | null
          signal_chain?: Json
          slug?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["pub_status"]
          tags?: string[]
          tier?: Database["public"]["Enums"]["solution_tier"]
          updated_at?: string
          updated_by?: string | null
          value_prop?: string
          wa_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "solutions_hero_media_id_fkey"
            columns: ["hero_media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solutions_hero_media_id_fkey"
            columns: ["hero_media_id"]
            isOneToOne: false
            referencedRelation: "v_media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solutions_hero_media_id_fkey"
            columns: ["hero_media_id"]
            isOneToOne: false
            referencedRelation: "v_product_images"
            referencedColumns: ["media_id"]
          },
          {
            foreignKeyName: "solutions_hero_media_id_fkey"
            columns: ["hero_media_id"]
            isOneToOne: false
            referencedRelation: "v_project_images"
            referencedColumns: ["media_id"]
          },
          {
            foreignKeyName: "solutions_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      spec_definitions: {
        Row: {
          better_direction:
            | Database["public"]["Enums"]["better_direction"]
            | null
          created_at: string
          data_type: Database["public"]["Enums"]["spec_data_type"]
          enum_options: string[] | null
          id: string
          is_archived: boolean
          is_comparable: boolean
          is_filterable: boolean
          key: string
          label: string
          product_type_id: string | null
          sort_order: number
          spec_group: string
          unit: string | null
          updated_at: string
        }
        Insert: {
          better_direction?:
            | Database["public"]["Enums"]["better_direction"]
            | null
          created_at?: string
          data_type: Database["public"]["Enums"]["spec_data_type"]
          enum_options?: string[] | null
          id?: string
          is_archived?: boolean
          is_comparable?: boolean
          is_filterable?: boolean
          key: string
          label: string
          product_type_id?: string | null
          sort_order?: number
          spec_group: string
          unit?: string | null
          updated_at?: string
        }
        Update: {
          better_direction?:
            | Database["public"]["Enums"]["better_direction"]
            | null
          created_at?: string
          data_type?: Database["public"]["Enums"]["spec_data_type"]
          enum_options?: string[] | null
          id?: string
          is_archived?: boolean
          is_comparable?: boolean
          is_filterable?: boolean
          key?: string
          label?: string
          product_type_id?: string | null
          sort_order?: number
          spec_group?: string
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "spec_definitions_product_type_id_fkey"
            columns: ["product_type_id"]
            isOneToOne: false
            referencedRelation: "product_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spec_definitions_product_type_id_fkey"
            columns: ["product_type_id"]
            isOneToOne: false
            referencedRelation: "v_product_types"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_article_categories: {
        Row: {
          id: string | null
          name: string | null
          slug: string | null
          sort_order: number | null
          type: Database["public"]["Enums"]["article_type"] | null
        }
        Insert: {
          id?: string | null
          name?: string | null
          slug?: string | null
          sort_order?: number | null
          type?: Database["public"]["Enums"]["article_type"] | null
        }
        Update: {
          id?: string | null
          name?: string | null
          slug?: string | null
          sort_order?: number | null
          type?: Database["public"]["Enums"]["article_type"] | null
        }
        Relationships: []
      }
      v_article_products: {
        Row: {
          article_id: string | null
          product_id: string | null
          sort_order: number | null
        }
        Relationships: [
          {
            foreignKeyName: "article_products_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_products_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "v_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_products"
            referencedColumns: ["id"]
          },
        ]
      }
      v_article_related: {
        Row: {
          article_id: string | null
          related_article_id: string | null
          sort_order: number | null
        }
        Relationships: [
          {
            foreignKeyName: "article_related_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_related_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "v_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_related_related_article_id_fkey"
            columns: ["related_article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_related_related_article_id_fkey"
            columns: ["related_article_id"]
            isOneToOne: false
            referencedRelation: "v_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      v_article_solutions: {
        Row: {
          article_id: string | null
          solution_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "article_solutions_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_solutions_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "v_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_solutions_solution_id_fkey"
            columns: ["solution_id"]
            isOneToOne: false
            referencedRelation: "solutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_solutions_solution_id_fkey"
            columns: ["solution_id"]
            isOneToOne: false
            referencedRelation: "v_solutions"
            referencedColumns: ["id"]
          },
        ]
      }
      v_articles: {
        Row: {
          author_name: string | null
          author_photo_media_id: string | null
          author_role: string | null
          body: Json | null
          category_id: string | null
          category_name: string | null
          category_slug: string | null
          cover_caption: string | null
          cover_credit: string | null
          cover_image_alt: string | null
          cover_image_path: string | null
          cover_image_url_ext: string | null
          cover_is_placeholder: boolean | null
          excerpt: string | null
          id: string | null
          is_featured: boolean | null
          level: Database["public"]["Enums"]["learn_level"] | null
          published_at: string | null
          reading_time: number | null
          seo_description: string | null
          seo_title: string | null
          slug: string | null
          tags: string[] | null
          title: string | null
          type: Database["public"]["Enums"]["article_type"] | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "articles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "article_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "v_article_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "authors_photo_media_id_fkey"
            columns: ["author_photo_media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "authors_photo_media_id_fkey"
            columns: ["author_photo_media_id"]
            isOneToOne: false
            referencedRelation: "v_media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "authors_photo_media_id_fkey"
            columns: ["author_photo_media_id"]
            isOneToOne: false
            referencedRelation: "v_product_images"
            referencedColumns: ["media_id"]
          },
          {
            foreignKeyName: "authors_photo_media_id_fkey"
            columns: ["author_photo_media_id"]
            isOneToOne: false
            referencedRelation: "v_project_images"
            referencedColumns: ["media_id"]
          },
        ]
      }
      v_authors: {
        Row: {
          id: string | null
          name: string | null
          photo_media_id: string | null
          role: string | null
        }
        Insert: {
          id?: string | null
          name?: string | null
          photo_media_id?: string | null
          role?: string | null
        }
        Update: {
          id?: string | null
          name?: string | null
          photo_media_id?: string | null
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "authors_photo_media_id_fkey"
            columns: ["photo_media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "authors_photo_media_id_fkey"
            columns: ["photo_media_id"]
            isOneToOne: false
            referencedRelation: "v_media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "authors_photo_media_id_fkey"
            columns: ["photo_media_id"]
            isOneToOne: false
            referencedRelation: "v_product_images"
            referencedColumns: ["media_id"]
          },
          {
            foreignKeyName: "authors_photo_media_id_fkey"
            columns: ["photo_media_id"]
            isOneToOne: false
            referencedRelation: "v_project_images"
            referencedColumns: ["media_id"]
          },
        ]
      }
      v_brands: {
        Row: {
          id: string | null
          is_authorized_dealer: boolean | null
          logo_media_id: string | null
          name: string | null
          slug: string | null
          website: string | null
        }
        Insert: {
          id?: string | null
          is_authorized_dealer?: boolean | null
          logo_media_id?: string | null
          name?: string | null
          slug?: string | null
          website?: string | null
        }
        Update: {
          id?: string | null
          is_authorized_dealer?: boolean | null
          logo_media_id?: string | null
          name?: string | null
          slug?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brands_logo_media_id_fkey"
            columns: ["logo_media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brands_logo_media_id_fkey"
            columns: ["logo_media_id"]
            isOneToOne: false
            referencedRelation: "v_media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brands_logo_media_id_fkey"
            columns: ["logo_media_id"]
            isOneToOne: false
            referencedRelation: "v_product_images"
            referencedColumns: ["media_id"]
          },
          {
            foreignKeyName: "brands_logo_media_id_fkey"
            columns: ["logo_media_id"]
            isOneToOne: false
            referencedRelation: "v_project_images"
            referencedColumns: ["media_id"]
          },
        ]
      }
      v_media: {
        Row: {
          alt: string | null
          caption: string | null
          external_url: string | null
          height: number | null
          id: string | null
          is_placeholder: boolean | null
          kind: Database["public"]["Enums"]["media_kind"] | null
          source_license: string | null
          storage_path: string | null
          width: number | null
        }
        Insert: {
          alt?: string | null
          caption?: string | null
          external_url?: string | null
          height?: number | null
          id?: string | null
          is_placeholder?: boolean | null
          kind?: Database["public"]["Enums"]["media_kind"] | null
          source_license?: string | null
          storage_path?: string | null
          width?: number | null
        }
        Update: {
          alt?: string | null
          caption?: string | null
          external_url?: string | null
          height?: number | null
          id?: string | null
          is_placeholder?: boolean | null
          kind?: Database["public"]["Enums"]["media_kind"] | null
          source_license?: string | null
          storage_path?: string | null
          width?: number | null
        }
        Relationships: []
      }
      v_page_sections: {
        Row: {
          content: Json | null
          page_key: string | null
          section_key: string | null
        }
        Insert: {
          content?: Json | null
          page_key?: string | null
          section_key?: string | null
        }
        Update: {
          content?: Json | null
          page_key?: string | null
          section_key?: string | null
        }
        Relationships: []
      }
      v_product_categories: {
        Row: {
          description: string | null
          id: string | null
          name: string | null
          slug: string | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          description?: string | null
          id?: string | null
          name?: string | null
          slug?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          description?: string | null
          id?: string | null
          name?: string | null
          slug?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      v_product_images: {
        Row: {
          alt: string | null
          external_url: string | null
          image_annotation: string | null
          is_placeholder: boolean | null
          kind: Database["public"]["Enums"]["media_kind"] | null
          media_id: string | null
          product_id: string | null
          sort_order: number | null
          storage_path: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_products"
            referencedColumns: ["id"]
          },
        ]
      }
      v_product_similar: {
        Row: {
          product_id: string | null
          similar_product_id: string | null
          sort_order: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_similar_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_similar_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_similar_similar_product_id_fkey"
            columns: ["similar_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_similar_similar_product_id_fkey"
            columns: ["similar_product_id"]
            isOneToOne: false
            referencedRelation: "v_products"
            referencedColumns: ["id"]
          },
        ]
      }
      v_product_solutions: {
        Row: {
          product_id: string | null
          solution_id: string | null
          sort_order: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_solutions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_solutions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_solutions_solution_id_fkey"
            columns: ["solution_id"]
            isOneToOne: false
            referencedRelation: "solutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_solutions_solution_id_fkey"
            columns: ["solution_id"]
            isOneToOne: false
            referencedRelation: "v_solutions"
            referencedColumns: ["id"]
          },
        ]
      }
      v_product_spec_values: {
        Row: {
          better_direction:
            | Database["public"]["Enums"]["better_direction"]
            | null
          data_type: Database["public"]["Enums"]["spec_data_type"] | null
          is_comparable: boolean | null
          is_filterable: boolean | null
          key: string | null
          label: string | null
          product_id: string | null
          sort_order: number | null
          spec_group: string | null
          unit: string | null
          value_boolean: boolean | null
          value_number: number | null
          value_options: string[] | null
          value_text: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_spec_values_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_spec_values_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_products"
            referencedColumns: ["id"]
          },
        ]
      }
      v_product_types: {
        Row: {
          category_id: string | null
          id: string | null
          name: string | null
          slug: string | null
          sort_order: number | null
        }
        Insert: {
          category_id?: string | null
          id?: string | null
          name?: string | null
          slug?: string | null
          sort_order?: number | null
        }
        Update: {
          category_id?: string | null
          id?: string | null
          name?: string | null
          slug?: string | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_types_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_types_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "v_product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      v_products: {
        Row: {
          brand_id: string | null
          brand_name: string | null
          brand_slug: string | null
          category_id: string | null
          category_slug: string | null
          created_at: string | null
          description_md: string | null
          id: string | null
          is_featured: boolean | null
          name: string | null
          product_type_id: string | null
          product_type_name: string | null
          product_type_slug: string | null
          seo_description: string | null
          seo_title: string | null
          short_spec: string | null
          slug: string | null
          spec_source_url: string | null
          suitable_for: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "v_brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "v_product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_product_type_id_fkey"
            columns: ["product_type_id"]
            isOneToOne: false
            referencedRelation: "product_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_product_type_id_fkey"
            columns: ["product_type_id"]
            isOneToOne: false
            referencedRelation: "v_product_types"
            referencedColumns: ["id"]
          },
        ]
      }
      v_project_images: {
        Row: {
          alt: string | null
          external_url: string | null
          is_placeholder: boolean | null
          kind: Database["public"]["Enums"]["media_kind"] | null
          media_id: string | null
          project_id: string | null
          sort_order: number | null
          storage_path: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_images_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_images_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      v_project_products: {
        Row: {
          product_id: string | null
          project_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_products_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_products_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      v_project_solutions: {
        Row: {
          project_id: string | null
          solution_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_solutions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_solutions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_solutions_solution_id_fkey"
            columns: ["solution_id"]
            isOneToOne: false
            referencedRelation: "solutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_solutions_solution_id_fkey"
            columns: ["solution_id"]
            isOneToOne: false
            referencedRelation: "v_solutions"
            referencedColumns: ["id"]
          },
        ]
      }
      v_projects: {
        Row: {
          cover_image_alt: string | null
          cover_image_path: string | null
          cover_image_url_ext: string | null
          cover_is_placeholder: boolean | null
          id: string | null
          location_label: string | null
          public_label: string | null
          scope_chips: string[] | null
          scope_description: string | null
          slug: string | null
          sort_order: number | null
          year: number | null
        }
        Relationships: []
      }
      v_redirects: {
        Row: {
          destination_path: string | null
          source_path: string | null
        }
        Insert: {
          destination_path?: string | null
          source_path?: string | null
        }
        Update: {
          destination_path?: string | null
          source_path?: string | null
        }
        Relationships: []
      }
      v_site_settings: {
        Row: {
          address: string | null
          business_hours: Json | null
          city: string | null
          claim_verified: boolean | null
          email: string | null
          featured_product_id: string | null
          footer_description: string | null
          instagram: string | null
          response_claim: string | null
          seo_default_description: string | null
          seo_default_title: string | null
          tagline: string | null
          whatsapp_number: string | null
        }
        Insert: {
          address?: string | null
          business_hours?: Json | null
          city?: string | null
          claim_verified?: boolean | null
          email?: string | null
          featured_product_id?: string | null
          footer_description?: string | null
          instagram?: string | null
          response_claim?: string | null
          seo_default_description?: string | null
          seo_default_title?: string | null
          tagline?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          address?: string | null
          business_hours?: Json | null
          city?: string | null
          claim_verified?: boolean | null
          email?: string | null
          featured_product_id?: string | null
          footer_description?: string | null
          instagram?: string | null
          response_claim?: string | null
          seo_default_description?: string | null
          seo_default_title?: string | null
          tagline?: string | null
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_settings_featured_product_id_fkey"
            columns: ["featured_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_settings_featured_product_id_fkey"
            columns: ["featured_product_id"]
            isOneToOne: false
            referencedRelation: "v_products"
            referencedColumns: ["id"]
          },
        ]
      }
      v_solution_sections: {
        Row: {
          body: string | null
          heading: string | null
          items: Json | null
          solution_id: string | null
          sort_order: number | null
          type: Database["public"]["Enums"]["solution_section_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "solution_sections_solution_id_fkey"
            columns: ["solution_id"]
            isOneToOne: false
            referencedRelation: "solutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solution_sections_solution_id_fkey"
            columns: ["solution_id"]
            isOneToOne: false
            referencedRelation: "v_solutions"
            referencedColumns: ["id"]
          },
        ]
      }
      v_solutions: {
        Row: {
          hero_annotations: Json | null
          hero_headline: string | null
          hero_image_alt: string | null
          hero_image_path: string | null
          hero_image_url_ext: string | null
          hero_is_placeholder: boolean | null
          hero_subcopy: string | null
          id: string | null
          name: string | null
          related_category_slugs: string[] | null
          seo_description: string | null
          seo_title: string | null
          signal_chain: Json | null
          slug: string | null
          sort_order: number | null
          tags: string[] | null
          tier: Database["public"]["Enums"]["solution_tier"] | null
          updated_at: string | null
          value_prop: string | null
          wa_message: string | null
        }
        Relationships: []
      }
      v_spec_definitions: {
        Row: {
          better_direction:
            | Database["public"]["Enums"]["better_direction"]
            | null
          data_type: Database["public"]["Enums"]["spec_data_type"] | null
          enum_options: string[] | null
          id: string | null
          is_comparable: boolean | null
          is_filterable: boolean | null
          key: string | null
          label: string | null
          product_type_id: string | null
          sort_order: number | null
          spec_group: string | null
          unit: string | null
        }
        Insert: {
          better_direction?:
            | Database["public"]["Enums"]["better_direction"]
            | null
          data_type?: Database["public"]["Enums"]["spec_data_type"] | null
          enum_options?: string[] | null
          id?: string | null
          is_comparable?: boolean | null
          is_filterable?: boolean | null
          key?: string | null
          label?: string | null
          product_type_id?: string | null
          sort_order?: number | null
          spec_group?: string | null
          unit?: string | null
        }
        Update: {
          better_direction?:
            | Database["public"]["Enums"]["better_direction"]
            | null
          data_type?: Database["public"]["Enums"]["spec_data_type"] | null
          enum_options?: string[] | null
          id?: string | null
          is_comparable?: boolean | null
          is_filterable?: boolean | null
          key?: string | null
          label?: string | null
          product_type_id?: string | null
          sort_order?: number | null
          spec_group?: string | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "spec_definitions_product_type_id_fkey"
            columns: ["product_type_id"]
            isOneToOne: false
            referencedRelation: "product_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spec_definitions_product_type_id_fkey"
            columns: ["product_type_id"]
            isOneToOne: false
            referencedRelation: "v_product_types"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admin_role: {
        Args: never
        Returns: Database["public"]["Enums"]["admin_role"]
      }
      is_active_admin: { Args: never; Returns: boolean }
      publish_due_articles: {
        Args: never
        Returns: {
          id: string
          slug: string
          type: Database["public"]["Enums"]["article_type"]
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      admin_role: "admin" | "editor"
      article_type: "news" | "learn"
      better_direction: "higher" | "lower"
      lead_form_type: "quote_form" | "contact_form"
      learn_level: "dasar" | "menengah"
      media_kind: "upload" | "external"
      pub_status: "draft" | "scheduled" | "published" | "archived"
      solution_section_type:
        | "pain_points"
        | "system_copy"
        | "scope_pillar"
        | "cta"
      solution_tier: "core" | "supporting"
      spec_data_type: "number" | "text" | "boolean" | "enum"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      admin_role: ["admin", "editor"],
      article_type: ["news", "learn"],
      better_direction: ["higher", "lower"],
      lead_form_type: ["quote_form", "contact_form"],
      learn_level: ["dasar", "menengah"],
      media_kind: ["upload", "external"],
      pub_status: ["draft", "scheduled", "published", "archived"],
      solution_section_type: [
        "pain_points",
        "system_copy",
        "scope_pillar",
        "cta",
      ],
      solution_tier: ["core", "supporting"],
      spec_data_type: ["number", "text", "boolean", "enum"],
    },
  },
} as const
